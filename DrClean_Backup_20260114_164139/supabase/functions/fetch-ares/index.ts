import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ico, name } = await req.json();

    if (!ico && !name) {
      return new Response(
        JSON.stringify({ error: 'IČO or company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let aresData;

    // Search by IČO if provided
    if (ico) {
      const cleanIco = ico.replace(/\D/g, '');
      const aresResponse = await fetch(
        `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${cleanIco}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!aresResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Company not found in ARES' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      aresData = await aresResponse.json();
    } 
    // Search by company name
    else if (name) {
      console.log('Searching ARES for company name:', name);
      const searchUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat?obchodniJmeno=${encodeURIComponent(name)}`;
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Search response status:', searchResponse.status);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('ARES search error:', errorText);
        return new Response(
          JSON.stringify({ error: `Company not found in ARES: ${errorText}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchData = await searchResponse.json();
      console.log('Search data:', JSON.stringify(searchData, null, 2));
      
      // Get the first result from search
      if (!searchData.ekonomickeSubjekty || searchData.ekonomickeSubjekty.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Company not found in ARES' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch full details of the first result
      const firstResult = searchData.ekonomickeSubjekty[0];
      const detailResponse = await fetch(
        `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${firstResult.ico}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!detailResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch company details' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      aresData = await detailResponse.json();
    }

    // Parse the ARES response
    const companyData = {
      name: aresData.obchodniJmeno || '',
      company_legal_name: aresData.obchodniJmeno || '',
      company_id: aresData.ico ? aresData.ico.toString() : '',
      address: '',
      city: '',
      postal_code: '',
    };

    // Parse address from ARES
    if (aresData.sidlo) {
      const sidlo = aresData.sidlo;
      const addressParts: string[] = [];
      
      if (sidlo.nazevUlice) {
        addressParts.push(sidlo.nazevUlice);
      }
      if (sidlo.cisloDomovni) {
        addressParts.push(sidlo.cisloDomovni.toString());
      }
      if (sidlo.cisloOrientacni) {
        addressParts.push(`/${sidlo.cisloOrientacni}`);
      }
      
      companyData.address = addressParts.join(' ');
      companyData.city = sidlo.nazevObce || '';
      companyData.postal_code = sidlo.psc ? sidlo.psc.toString().replace(/(\d{3})(\d{2})/, '$1 $2') : '';
    }

    return new Response(
      JSON.stringify(companyData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching ARES data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch company data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});