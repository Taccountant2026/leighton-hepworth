# Connect leightonhepworth.com

The first LH website is published privately at https://leighton-hepworth.taccountant.chatgpt.site. Its separate hosting project is `appgprj_6ad8bd88eda08191920af743b641c3b2`.

Custom domain status: active. Sites confirmed both `leightonhepworth.com` and `www.leightonhepworth.com` are connected, with HTTPS active, on 21 October 2026. The owner has authorised public publication of the personal website.

The supplied screenshot confirms the domain is managed through Namecheap. In Domain List → Manage → Advanced DNS → Host Records, use the records below with Automatic TTL. Namecheap adds the domain suffix, so enter the short Host values shown.

The screenshot shows four existing A records for `@`, pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. These are website records. When switching the website to this hosting, replace those four entries with the two A records below. Add the `www` CNAME and the four TXT verification records; first check for any existing conflicting website records at `www`.

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 162.159.143.30 |
| A | @ | 172.66.3.26 |
| CNAME | www | custom-domains.chatgpt.site. |
| TXT | _openai-site-verification | openai-site-verification=qb3xgxsosU-Zxt8JCu2ia1pLrb1Ruuk1A-8f_v0sy6Q |
| TXT | _cf-custom-hostname | 3319b3b2-6a68-4fb6-b7a1-0e94edc56553 |
| TXT | _openai-site-verification.www | openai-site-verification=biX4yDiBjSWctMEPbyE6yVNQuZmEzmSwgw9Nc2HuRD0 |
| TXT | _cf-custom-hostname.www | a24f5ebe-35e1-410e-91ef-4f3fd1ef7c3c |

### Email records to preserve

The screenshot shows an `autodiscover` CNAME pointing to `autodiscover.outlook.com.` and a Custom MX entry at `@`. The MX destination is truncated in the screenshot, so keep its full existing value and priority exactly as Namecheap has them. These records support email; they do not need to change for the website. Keep any other existing email-related TXT, DKIM and DMARC records as well.

These website records are now verified. If changing them later, replace conflicting website A/AAAA/CNAME records only at the hostnames being connected, then refresh custom-domain status in Sites. Preserve the existing email records.

The LH website is prepared for public access and search crawling. Search-engine indexing is decided by the search engines and is not guaranteed by successful DNS verification.

## Dedicated GitHub source

Repository: https://github.com/Taccountant2026/leighton-hepworth (private). This is a separate, independently created repository for the LH website. Do not put this source into another business repository.
