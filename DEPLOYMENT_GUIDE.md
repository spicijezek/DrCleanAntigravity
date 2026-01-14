# Deployment & Workflow Guide 🚀

This guide explains how to update your software using Antigravity and how to connect your custom subdomain.

## 1. How to Publish Future Changes
Every time we make changes to the code here in Antigravity, follow these 3 steps to see them live on your Vercel URL:

1.  **Work with Antigravity**: Let me make the UI or logic changes you need.
2.  **Commit the Work**: (You can ask me to do this or run it in your terminal):
    ```bash
    git add .
    git commit -m "Description of what we changed"
    ```
3.  **Push to GitHub**:
    ```bash
    git push
    ```
**Result**: Vercel will see the push, start a "Building" process automatically, and update your website in about 1-2 minutes.

---

## 2. Connect Your Subdomain (`app.drclean.cz`)

Follow these exact steps to move from the `.vercel.app` URL to your own:

### Step A: Vercel Configuration
1.  Go to your **Vercel Dashboard** → Select your project.
2.  Go to **Settings** (top) → **Domains** (left sidebar).
3.  Type `app.drclean.cz` in the box and click **Add**.
4.  If it asks if you want to redirect `drclean.cz` to it, usually you should say **No** (since you likely have a main website on the main domain).
5.  Vercel will now show a status of **"Invalid Configuration"** and provide you with a **CNAME** record.
    - **Name/Host**: `app`
    - **Value/Target**: `cname.vercel-dns.com`

### Step B: DNS Provider Configuration
1.  Log in to your **Domain Provider's** control panel (where you bought `drclean.cz`).
2.  Go to **DNS Management** or **DNS Settings**.
3.  Add a new **CNAME Record**:
    - **Host/Name**: `app`
    - **Value/Points to**: `cname.vercel-dns.com`
    - **TTL**: Auto or 3600.
4.  **Save** the record.

### Step C: Verify in Vercel
- Go back to your Vercel Domains settings. It might take 10 minutes to verify. Once the "Invalid Configuration" message turns into a green **"Valid"** checkmark, your domain is live!

---

## 3. Update Supabase (Final Step)
Because you use Login/Passwords, Supabase needs to know your new domain is "safe."
1.  Go to your [Supabase Dashboard](https://app.supabase.com).
2.  Go to **Authentication** → **URL Configuration**.
3.  In the **Redirect URLs** section, click **Add URL**.
4.  Add: `https://app.drclean.cz`
5.  Save.

**You are now done! Your software is officially running on your custom subdomain.**
