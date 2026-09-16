import csv
import json
import os
import re

rows = [
    ("Microsoft","Big Tech","https://www.linkedin.com/company/microsoft/","https://careers.microsoft.com/"),
    ("Google","Big Tech","https://www.linkedin.com/company/google/","https://www.google.com/about/careers/"),
    ("Amazon","Big Tech","https://www.linkedin.com/company/amazon/","https://www.amazon.jobs/"),
    ("Apple","Big Tech","https://www.linkedin.com/company/apple/","https://www.apple.com/careers/"),
    ("Meta","Big Tech","https://www.linkedin.com/company/meta/","https://www.metacareers.com/"),
    ("Netflix","Big Tech / Media","https://www.linkedin.com/company/netflix/","https://jobs.netflix.com/"),
    ("NVIDIA","Semiconductors / AI","https://www.linkedin.com/company/nvidia/","https://www.nvidia.com/en-us/about-nvidia/careers/"),
    ("Adobe","Software","https://www.linkedin.com/company/adobe/","https://www.adobe.com/careers.html"),
    ("Oracle","Enterprise Software","https://www.linkedin.com/company/oracle/","https://www.oracle.com/careers/"),
    ("IBM","Enterprise Technology","https://www.linkedin.com/company/ibm/","https://www.ibm.com/careers/"),
    ("Salesforce","Enterprise SaaS","https://www.linkedin.com/company/salesforce/","https://www.salesforce.com/company/careers/"),
    ("SAP","Enterprise Software","https://www.linkedin.com/company/sap/","https://www.sap.com/about/careers.html"),
    ("ServiceNow","Enterprise SaaS","https://www.linkedin.com/company/servicenow/","https://www.servicenow.com/careers.html"),
    ("Atlassian","Enterprise SaaS","https://www.linkedin.com/company/atlassian/","https://www.atlassian.com/company/careers"),
    ("Workday","Enterprise SaaS","https://www.linkedin.com/company/workday/","https://www.workday.com/en-us/company/careers.html"),
    ("Intuit","Financial Software","https://www.linkedin.com/company/intuit/","https://www.intuit.com/careers/"),
    ("Broadcom","Semiconductors / Infrastructure","https://www.linkedin.com/company/broadcom/","https://www.broadcom.com/company/careers"),
    ("Cisco","Networking / Cloud","https://www.linkedin.com/company/cisco/","https://jobs.cisco.com/"),
    ("Snowflake","Cloud / Data","https://www.linkedin.com/company/snowflake-computing/","https://careers.snowflake.com/"),
    ("Datadog","Cloud / Observability","https://www.linkedin.com/company/datadog/","https://careers.datadoghq.com/"),
    ("Stripe","Fintech","https://www.linkedin.com/company/stripe/","https://stripe.com/jobs"),
    ("PayPal","Fintech","https://www.linkedin.com/company/paypal/","https://careers.pypl.com/"),
    ("Razorpay","Fintech","https://www.linkedin.com/company/razorpay/","https://razorpay.com/careers/"),
    ("PhonePe","Fintech","https://www.linkedin.com/company/phonepe-internet/","https://www.phonepe.com/careers/"),
    ("Cashfree Payments","Fintech","https://www.linkedin.com/company/cashfree/","https://www.cashfree.com/careers/"),
    ("Juspay","Fintech","https://www.linkedin.com/company/juspay/","https://juspay.io/careers"),
    ("CRED","Fintech","https://www.linkedin.com/company/credapp/","https://careers.cred.club/"),
    ("Pine Labs","Fintech","https://www.linkedin.com/company/pinelabs/","https://www.pinelabs.com/careers/open-jobs"),
    ("Paytm","Fintech","https://www.linkedin.com/company/paytm/","https://paytm.com/careers/"),
    ("BharatPe","Fintech","https://www.linkedin.com/company/bharatpe/","https://www.linkedin.com/company/bharatpe/jobs/"),
    ("Groww","Fintech","https://www.linkedin.com/company/groww.in/","https://groww.in/careers"),
    ("Zerodha","Fintech","https://www.linkedin.com/company/zerodha/","https://zerodha.com/careers/"),
    ("Upstox","Fintech","https://www.linkedin.com/company/upstox/","https://upstox.com/careers/"),
    ("Adyen","Fintech","https://www.linkedin.com/company/adyen/","https://careers.adyen.com/"),
    ("Checkout.com","Fintech","https://www.linkedin.com/company/checkout-com/","https://www.checkout.com/careers"),
    ("Flipkart","E-commerce","https://www.linkedin.com/company/flipkart/","https://www.flipkartcareers.com/"),
    ("Walmart Global Tech","E-commerce / Technology","https://www.linkedin.com/company/walmart-global-tech/","https://tech.walmart.com/content/walmart-global-tech/us/en_us/careers.html"),
    ("eBay","E-commerce","https://www.linkedin.com/company/ebay/","https://jobs.ebayinc.com/"),
    ("Meesho","E-commerce","https://www.linkedin.com/company/meesho/","https://www.meesho.io/jobs"),
    ("Myntra","E-commerce","https://www.linkedin.com/company/myntra/","https://careers.myntra.com/"),
    ("Swiggy","Consumer Tech","https://www.linkedin.com/company/swiggy/","https://careers.swiggy.com/"),
    ("Zomato","Consumer Tech","https://www.linkedin.com/company/zomato/","https://www.zomato.com/careers"),
    ("Zepto","Consumer Tech","https://www.linkedin.com/company/zeptonow/","https://www.zepto.com/careers"),
    ("Blinkit","Consumer Tech","https://www.linkedin.com/company/blinkit/","https://blinkit.com/careers"),
    ("Nykaa","E-commerce","https://www.linkedin.com/company/nykaa/","https://www.nykaa.com/careers"),
    ("Cloudflare","Cloud / Cybersecurity","https://www.linkedin.com/company/cloudflare/","https://www.cloudflare.com/careers/jobs/"),
    ("Zscaler","Cybersecurity","https://www.linkedin.com/company/zscaler/","https://www.zscaler.com/careers"),
    ("Palo Alto Networks","Cybersecurity","https://www.linkedin.com/company/palo-alto-networks/","https://jobs.paloaltonetworks.com/"),
    ("CrowdStrike","Cybersecurity","https://www.linkedin.com/company/crowdstrike/","https://www.crowdstrike.com/careers/"),
    ("Okta","Cybersecurity","https://www.linkedin.com/company/okta-inc-/","https://www.okta.com/company/careers/"),
    ("Fortinet","Cybersecurity","https://www.linkedin.com/company/fortinet/","https://www.fortinet.com/corporate/careers"),
    ("Akamai","Cloud / Networking","https://www.linkedin.com/company/akamai-technologies/","https://www.akamai.com/careers"),
    ("HashiCorp","Cloud / DevOps","https://www.linkedin.com/company/hashicorp/","https://www.hashicorp.com/careers"),
    ("MongoDB","Database / Cloud","https://www.linkedin.com/company/mongodb/","https://www.mongodb.com/careers"),
    ("Elastic","Search / Cloud","https://www.linkedin.com/company/elastic-co/","https://www.elastic.co/about/careers"),
    ("Freshworks","SaaS","https://www.linkedin.com/company/freshworks-inc/","https://www.freshworks.com/company/careers/"),
    ("Zoho","SaaS","https://www.linkedin.com/company/zoho/","https://www.zoho.com/careers/"),
    ("Chargebee","SaaS / Billing","https://www.linkedin.com/company/chargebee/","https://www.chargebee.com/careers/"),
    ("Postman","Developer Tools","https://www.linkedin.com/company/postman-platform/","https://www.postman.com/company/careers/"),
    ("BrowserStack","Developer Tools","https://www.linkedin.com/company/browserstack/","https://www.browserstack.com/careers"),
    ("Darwinbox","HR SaaS","https://www.linkedin.com/company/darwinbox/","https://darwinbox.com/careers"),
    ("Druva","Cloud / Data Protection","https://www.linkedin.com/company/druva/","https://www.druva.com/company/careers"),
    ("Thoughtworks","Software Engineering","https://www.linkedin.com/company/thoughtworks/","https://www.thoughtworks.com/careers"),
    ("Miro","Collaboration SaaS","https://www.linkedin.com/company/miro/","https://miro.com/careers/"),
    ("HubSpot","SaaS","https://www.linkedin.com/company/hubspot/","https://www.hubspot.com/careers"),
    ("GitLab","Developer Tools","https://www.linkedin.com/company/gitlab-com/","https://about.gitlab.com/jobs/"),
    ("GitHub","Developer Tools","https://www.linkedin.com/company/github/","https://www.github.careers/"),
    ("Tata 1mg","Healthtech","https://www.linkedin.com/company/tata-1mg/","https://www.1mg.com/careers"),
    ("Practo","Healthtech","https://www.linkedin.com/company/practo-technologies/","https://www.practo.com/company/careers"),
    ("PharmEasy","Healthtech","https://www.linkedin.com/company/pharmeasy/","https://pharmeasy.in/careers"),
    ("Innovaccer","Healthtech","https://www.linkedin.com/company/innovaccer/","https://innovaccer.com/careers"),
    ("CitiusTech","Healthtech","https://www.linkedin.com/company/citiustech/","https://www.citiustech.com/careers/"),
    ("MediBuddy","Healthtech","https://www.linkedin.com/company/medibuddy/","https://www.medibuddy.in/careers"),
    ("Apollo 24|7","Healthtech","https://www.linkedin.com/company/apollo-247/","https://www.apollo247.com/careers"),
    ("Roche","Healthcare Technology","https://www.linkedin.com/company/roche/","https://careers.roche.com/"),
    ("Siemens Healthineers","Healthcare Technology","https://www.linkedin.com/company/siemens-healthineers/","https://www.siemens-healthineers.com/careers"),
    ("Philips","Healthcare Technology","https://www.linkedin.com/company/philips/","https://www.careers.philips.com/"),
    ("Uber","Mobility","https://www.linkedin.com/company/uber-com/","https://www.uber.com/us/en/careers/"),
    ("Ola","Mobility","https://www.linkedin.com/company/olacabs/","https://www.olacabs.com/careers"),
    ("Rapido","Mobility","https://www.linkedin.com/company/rapido-bike/","https://www.rapido.bike/careers"),
    ("MakeMyTrip","Travel Tech","https://www.linkedin.com/company/makemytrip.com/","https://www.makemytrip.com/careers/"),
    ("Expedia Group","Travel Tech","https://www.linkedin.com/company/expedia-group/","https://careers.expediagroup.com/"),
    ("Airbnb","Travel Tech","https://www.linkedin.com/company/airbnb/","https://careers.airbnb.com/"),
    ("Booking.com","Travel Tech","https://www.linkedin.com/company/booking.com/","https://careers.booking.com/"),
    ("Delhivery","Logistics Tech","https://www.linkedin.com/company/delhivery/","https://www.delhivery.com/careers/"),
    ("Porter","Logistics Tech","https://www.linkedin.com/company/porter-in/","https://www.porter.in/careers"),
    ("Shiprocket","Logistics Tech","https://www.linkedin.com/company/shiprocket/","https://www.shiprocket.in/careers/"),
    ("Ericsson","Telecom","https://www.linkedin.com/company/ericsson/","https://www.ericsson.com/en/careers"),
    ("Nokia","Telecom","https://www.linkedin.com/company/nokia/","https://www.nokia.com/about-us/careers/"),
    ("Qualcomm","Semiconductors","https://www.linkedin.com/company/qualcomm/","https://www.qualcomm.com/company/careers"),
    ("Samsung Electronics","Technology / Electronics","https://www.linkedin.com/company/samsung-electronics/","https://www.samsung.com/us/careers/"),
    ("Intel","Semiconductors","https://www.linkedin.com/company/intel-corporation/","https://jobs.intel.com/"),
    ("Electronic Arts","Gaming","https://www.linkedin.com/company/electronic-arts/","https://www.ea.com/careers"),
    ("Ubisoft","Gaming","https://www.linkedin.com/company/ubisoft/","https://www.ubisoft.com/en-us/company/careers"),
    ("Sony","Technology / Entertainment","https://www.linkedin.com/company/sony/","https://www.sony.com/en/SonyInfo/Careers/"),
    ("Spotify","Media Technology","https://www.linkedin.com/company/spotify/","https://www.lifeatspotify.com/jobs"),
    ("Disney","Media Technology","https://www.linkedin.com/company/the-walt-disney-company/","https://jobs.disneycareers.com/"),
]

# 1. Save CSV
csv_path = "Data/software_tech_target_companies.csv"
os.makedirs("Data", exist_ok=True)
with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["No", "Company", "Sector", "LinkedIn_URL", "Official_Careers_URL"])
    for idx, r in enumerate(rows, 1):
        writer.writerow([idx, r[0], r[1], r[2], r[3]])

print(f"Saved {len(rows)} companies to {csv_path}")

# 2. Extract slug helper
def extract_slug(url):
    m = re.search(r'linkedin\.com/company/([^/]+)', url)
    if m:
        return m.group(1).lower().strip()
    return ""

# 3. Read existing seed companies
seed_path = "src/data/seed-companies.json"
existing_data = []
if os.path.exists(seed_path):
    with open(seed_path, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

# Index existing by name lower and slug lower
existing_by_name = {c["name"].strip().lower(): c for c in existing_data}
existing_by_slug = {c["slug"].strip().lower(): c for c in existing_data if c.get("slug")}

already_had = []
newly_added = []

for r in rows:
    name, sector, linkedin, careers = r[0], r[1], r[2], r[3]
    slug = extract_slug(linkedin)
    name_key = name.strip().lower()
    slug_key = slug.strip().lower()

    # Check if already present
    if name_key in existing_by_name:
        matched = existing_by_name[name_key]
        already_had.append(name)
        # Update careers URL if not set
        if not matched.get("careersUrl") and careers:
            matched["careersUrl"] = careers
        continue
    elif slug_key and slug_key in existing_by_slug:
        matched = existing_by_slug[slug_key]
        already_had.append(name)
        if not matched.get("careersUrl") and careers:
            matched["careersUrl"] = careers
        continue

    # New company
    new_record = {
        "id": slug or name.lower().replace(" ", "-"),
        "rank": None,
        "name": name,
        "slug": slug,
        "category": sector,
        "linkedInUrl": linkedin,
        "careersUrl": careers,
        "verified": True,
        "source": "software_tech_target_companies.csv",
        "updatedAt": "2026-09-17T00:00:00Z"
    }
    existing_data.append(new_record)
    existing_by_name[name_key] = new_record
    if slug_key:
        existing_by_slug[slug_key] = new_record
    newly_added.append(name)

# Sort: ranked items first (by rank), then unranked alphabetically by name
def sort_key(c):
    if c.get("rank") is not None:
        return (0, c["rank"], c["name"])
    return (1, 0, c["name"])

existing_data.sort(key=sort_key)

# Save updated seed dataset
with open(seed_path, "w", encoding="utf-8") as f:
    json.dump(existing_data, f, indent=2)

print(f"\n--- Merge Report ---")
print(f"Total rows inspected: {len(rows)}")
print(f"Already had ({len(already_had)}): {', '.join(already_had[:10])}...")
print(f"Newly added ({len(newly_added)}): {', '.join(newly_added[:10])}...")
print(f"Total companies now in database: {len(existing_data)}")
