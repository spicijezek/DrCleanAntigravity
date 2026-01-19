import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GOOGLE_SCRIPT_URL = Deno.env.get("GOOGLE_SCRIPT_URL");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    invoice_number: string;
    client_email: string;
    client_name: string;
    pdf_url: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { invoice_number, client_email, client_name, pdf_url }: EmailRequest = await req.json();

        console.log(`Sending invoice ${invoice_number} to ${client_email} via Google Apps Script`);

        if (!GOOGLE_SCRIPT_URL) {
            console.error("GOOGLE_SCRIPT_URL is not set");
            return new Response(
                JSON.stringify({ error: "Server misconfiguration: Missing Google Script URL" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!client_email || !pdf_url) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: client_email or pdf_url" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Prepare payload for Google Apps Script
        const emailPayload = {
            to: client_email,
            subject: `Faktura č. ${invoice_number} - Dr.Clean`,
            htmlBody: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Dobrý den, ${client_name},</h2>
                    <p>děkujeme, že využíváte služeb Dr.Clean.</p>
                    <p>V příloze naleznete fakturu č. <strong>${invoice_number}</strong> za provedený úklid.</p>
                    <br/>
                    <p>S pozdravem,</p>
                    <p><strong>Tým Dr.Clean</strong><br/>
                    <a href="https://drclean.cz">www.drclean.cz</a><br/>
                    <a href="mailto:uklid@drclean.cz">uklid@drclean.cz</a></p>
                </div>
            `,
            pdfUrl: pdf_url,
            fileName: `Faktura_${invoice_number}.pdf`
        };

        // Send request to Google Apps Script
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
        });

        // Google Apps Script usually redirects (302) to a confirmation page on success, 
        // OR returns JSON if using ContentService correctly.
        // Let's handle both cases.

        const responseText = await res.text();
        console.log("GAS Response Status:", res.status);
        console.log("GAS Response Text:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // If it's not JSON (e.g. HTML error page or redirect body), treat as error unless status is 200/302
            data = { success: false, raw: responseText };
        }

        if (res.ok || data.success || res.status === 302) {
            console.log("Email sent successfully via GAS");
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } else {
            console.error("GAS Error:", data);
            return new Response(JSON.stringify({ error: `GAS Error: ${res.status} - ${responseText.substring(0, 100)}` }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

    } catch (error: any) {
        console.error("Error in send-client-invoice function:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

serve(handler);
