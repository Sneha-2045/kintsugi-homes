from playwright.sync_api import sync_playwright
from datetime import datetime
import re
import os
import hashlib


BASE_URL = "https://www.auction.com"


# ==========================================
# MARKETS TO SEARCH
# ==========================================
MARKETS = [
    ("Florida", "Miami"),
    ("Florida", "Tampa"),
    ("Florida", "Orlando"),
    ("Texas", "Houston"),
    ("Texas", "Dallas"),
    ("Georgia", "Atlanta"),
    ("North Carolina", "Charlotte"),
]


STATE_CODES = {
    "Florida": "FL",
    "Texas": "TX",
    "Georgia": "GA",
    "North Carolina": "NC",
}


# ==========================================
# MINIMUM DAYS BEFORE AUCTION
# ==========================================
MIN_DAYS = 10


# ==========================================
# SEARCH URL
# ==========================================
def make_search_url(state, city):
    state_code = STATE_CODES[state]

    return (
        f"{BASE_URL}/residential/"
        f"{state_code}/"
        f"{city}_ct/"
        f"active_lt/"
        f"auction_date_order_st/"
        f"2131489_oa/"
        f"goto_mt/y_nbs/foreclosures_at"
    )


# ==========================================
# GET NUMBER FROM TEXT
# ==========================================
def get_number(pattern, text):
    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1)

    return None


# ==========================================
# START SCRAPER
# ==========================================
today = datetime.now().replace(
    hour=0,
    minute=0,
    second=0,
    microsecond=0
)

qualifying_properties = []


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    print("\n======================================")
    print("US FORECLOSURE SCRAPER STARTED")
    print("======================================")

    # ======================================
    # SEARCH EACH MARKET
    # ======================================
    for state, city in MARKETS:

        search_url = make_search_url(
            state,
            city
        )

        print("\n--------------------------------------")
        print(f"SEARCHING: {city}, {state}")
        print("--------------------------------------")

        try:

            page.goto(
                search_url,
                wait_until="domcontentloaded",
                timeout=60000
            )

            page.wait_for_timeout(7000)

            # ==================================
            # COLLECT PROPERTY LINKS
            # ==================================
            links = page.locator("a")

            property_urls = []

            for i in range(links.count()):

                href = links.nth(i).get_attribute("href")

                if href and "/details/" in href:

                    if href.startswith("http"):
                        url = href
                    else:
                        url = BASE_URL + href

                    if url not in property_urls:
                        property_urls.append(url)

            print(
                "Properties found on this page:",
                len(property_urls)
            )

            # ==================================
            # CHECK EACH PROPERTY
            # ==================================
            for url in property_urls:

                print("\nChecking:", url)

                try:

                    page.goto(
                        url,
                        wait_until="domcontentloaded",
                        timeout=60000
                    )

                    page.wait_for_timeout(2000)

                    text = page.locator(
                        "body"
                    ).inner_text()

                    # ==================================
                    # FORECLOSURE SALE CHECK
                    # ==================================
                    foreclosure_match = re.search(
                        r"\bForeclosure Sale\b",
                        text,
                        re.IGNORECASE
                    )

                    if not foreclosure_match:

                        print(
                            "SKIPPED: Not Foreclosure Sale"
                        )

                        continue

                    print(
                        "✓ Foreclosure Sale confirmed"
                    )

                    # ==================================
                    # AUCTION DATE
                    # ==================================
                    date_position = text.find("Date")

                    if date_position == -1:

                        print(
                            "SKIPPED: Date section not found"
                        )

                        continue

                    date_section = text[
                        date_position:
                        date_position + 200
                    ]

                    date_match = re.search(
                        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
                        r"\s+\d{1,2},\s+\d{4}",
                        date_section
                    )

                    if not date_match:

                        print(
                            "SKIPPED: Auction date not found"
                        )

                        continue

                    date_text = date_match.group(0)

                    auction_date = datetime.strptime(
                        date_text,
                        "%b %d, %Y"
                    ).replace(
                        hour=0,
                        minute=0,
                        second=0,
                        microsecond=0
                    )

                    days_left = (
                        auction_date - today
                    ).days

                    print(
                        "Auction:",
                        date_text
                    )

                    print(
                        "Days left:",
                        days_left
                    )

                    # ==================================
                    # 10 DAY FILTER
                    # ==================================
                    if days_left < MIN_DAYS:

                        print(
                            f"SKIPPED: Less than "
                            f"{MIN_DAYS} days"
                        )

                        continue

                    # ==================================
                    # PROPERTY TITLE
                    # ==================================
                    title = page.title().strip()

                    if not title:

                        title = (
                            f"Foreclosure Property "
                            f"in {city}, {state}"
                        )

                    # ==================================
                    # BEDROOMS
                    # ==================================
                    beds = get_number(
                        r"(\d+)\s+Beds?",
                        text
                    )

                    # ==================================
                    # BATHROOMS
                    # ==================================
                    baths = get_number(
                        r"([\d.]+)\s+Baths?",
                        text
                    )

                    # ==================================
                    # SQUARE FEET
                    # ==================================
                    sqft = get_number(
                        r"([\d,]+)\s+Sq\.\s*Feet",
                        text
                    )

                    # ==================================
                    # MARKET VALUE
                    # ==================================
                    market_value_match = re.search(
                        r"Est\.\s*Market Value\s+\$([\d,]+)",
                        text,
                        re.IGNORECASE
                    )

                    if market_value_match:

                        market_value = int(
                            market_value_match
                            .group(1)
                            .replace(",", "")
                        )

                    else:

                        market_value = 0

                    # ==================================
                    # IMAGE
                    # ==================================
                    image_url = ""

                    images = page.locator("img")

                    for i in range(images.count()):

                        src = images.nth(i).get_attribute(
                            "src"
                        )

                        if src and src.startswith("http"):

                            image_url = src

                            break

                    # ==================================
                    # STABLE PROPERTY ID
                    # ==================================
                    property_hash = hashlib.md5(
                        url.encode()
                    ).hexdigest()[:10]

                    property_id = (
                        city.lower()
                        + "-"
                        + property_hash
                    )

                    # ==================================
                    # PROPERTY OBJECT
                    # ==================================
                    property_data = {

                        "id": property_id,

                        "title": title,

                        "location": f"{city}, {state}",

                        "prefecture": state,

                        "regionSlug": state.lower().replace(
                            " ",
                            "-"
                        ),

                        "prefectureSlug": state.lower().replace(
                            " ",
                            "-"
                        ),

                        "categorySlug": "foreclosure-sale",

                        "priceUsd": market_value,

                        "addedDaysAgo": 0,

                        "images": (
                            [image_url]
                            if image_url
                            else []
                        ),

                        "tags": [
                            "Foreclosure Sale",
                            "Investment"
                        ],

                        "extraTags": 0,

                        "bedrooms": (
                            int(beds)
                            if beds
                            else None
                        ),

                        "floorArea": (
                            int(
                                sqft.replace(",", "")
                            )
                            if sqft
                            else None
                        ),

                        "amenity": (
                            f"{city}, {state}"
                        ),

                        "description": (
                            f"Foreclosure property in "
                            f"{city}, {state}. "
                            f"Auction scheduled for "
                            f"{date_text}."
                        ),

                        "auctionDate": date_text,

                        "propertyType": (
                            "Foreclosure Sale"
                        ),
                    }

                    qualifying_properties.append(
                        property_data
                    )

                    print(
                        "\n✓ QUALIFYING PROPERTY"
                    )

                    print(
                        "Title:",
                        title
                    )

                    print(
                        "Location:",
                        city,
                        state
                    )

                    print(
                        "Auction:",
                        date_text
                    )

                    print(
                        "Days left:",
                        days_left
                    )

                    print(
                        "Market Value:",
                        market_value
                    )

                    print(
                        "URL:",
                        url
                    )

                except Exception as e:

                    print(
                        "ERROR checking property:",
                        e
                    )

        except Exception as e:

            print(
                f"ERROR searching "
                f"{city}, {state}:",
                e
            )

    browser.close()


# ==========================================
# REMOVE DUPLICATES
# ==========================================
unique_properties = []

seen_ids = set()


for property_data in qualifying_properties:

    if property_data["id"] not in seen_ids:

        seen_ids.add(
            property_data["id"]
        )

        unique_properties.append(
            property_data
        )


# ==========================================
# CREATE TYPESCRIPT FILE
# ==========================================
output_file = os.path.join(
    os.path.dirname(__file__),
    "..",
    "src",
    "data",
    "us-listings.ts"
)

output_file = os.path.abspath(
    output_file
)


with open(
    output_file,
    "w",
    encoding="utf-8"
) as file:

    file.write(
        'import type { Property } from "@/types/property";\n\n'
    )

    file.write(
        "export const usListings: Property[] = [\n"
    )

    for property_data in unique_properties:

        file.write("  {\n")

        for key, value in property_data.items():

            if value is None:

                file.write(
                    f"    {key}: undefined,\n"
                )

            elif isinstance(value, str):

                escaped = (
                    value
                    .replace("\\", "\\\\")
                    .replace('"', '\\"')
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                )

                file.write(
                    f'    {key}: "{escaped}",\n'
                )

            elif isinstance(value, list):

                formatted_list = ", ".join(
                    f'"{str(item).replace(chr(34), chr(92) + chr(34))}"'
                    for item in value
                )

                file.write(
                    f"    {key}: [{formatted_list}],\n"
                )

            else:

                file.write(
                    f"    {key}: {value},\n"
                )

        file.write("  },\n")

    file.write("];\n")


# ==========================================
# FINAL RESULT
# ==========================================
print("\n======================================")
print("SCRAPING FINISHED")
print("======================================")

print(
    "Qualifying properties:",
    len(unique_properties)
)

print(
    "\nUpdated:",
    output_file
)

print(
    "\n10-day foreclosure filter applied."
)

print(
    "Bank Owned / REO properties excluded "
    "by property type check."
)

print(
    "US listings are ready for the website."
)