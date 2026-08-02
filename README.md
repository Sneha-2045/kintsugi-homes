# Kintsugi Homes

Build a complete, production-quality FRONTEND-ONLY real estate marketplace website inspired by the layout, UX, visual hierarchy, and dark aesthetic shown in the reference screenshots I provided.

IMPORTANT:

- Frontend only.

- Do NOT build a backend.

- Do NOT create authentication logic.

- Do NOT connect Stripe, PayPal, databases, APIs, Firebase, Supabase, etc.

- All data must be realistic MOCK DATA stored locally in TypeScript/JSON files.

- Buttons and interactions should work visually using frontend state and routing.

- Do not copy the original site's branding, logo, proprietary text, or exact assets.

- Create an original brand and original content while closely following the overall layout and UX shown in the screenshots.

TECH STACK

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- React Router

- Lucide React icons

Keep dependencies minimal.

Use reusable components and clean production-quality code.

--------------------------------------------------

DESIGN SYSTEM

--------------------------------------------------

Create a premium dark Japanese real-estate marketplace.

Main colors:

Page background:

#0B1628 / #0D192B

Alternate section background:

#1B293B

Card background:

#1D2A3C

Elevated card:

#223146

Border:

rgba(148,163,184,0.20)

Primary blue:

#3B82F6

Primary hover:

#2563EB

Light blue:

#60A5FA

Green:

#22C55E

Orange:

#FB923C

Purple:

#C084FC

Main text:

#F8FAFC

Secondary text:

#A7B0BF

Muted text:

#7C8798

The design should feel:

- premium

- trustworthy

- data-driven

- modern

- spacious

- professional

- Japanese real-estate focused

Avoid excessive gradients, glassmorphism, neon effects and unnecessary animations.

Use subtle:

- borders

- shadows

- hover states

- transitions

- card elevation

Maximum content width approximately:

1280-1360px

Desktop sections should have generous vertical spacing.

Responsive breakpoints must work properly for:

desktop, laptop, tablet and mobile.

--------------------------------------------------

1. NAVBAR

--------------------------------------------------

Create a full-width dark navbar.

Left:

Original text-based real-estate brand logo.

Under the English brand name include a tiny Japanese subtitle.

Navigation:

Search

Map

Articles

Saved

Pricing

Consult

Right:

settings icon

Log in

bright blue "Start Free Trial" button

Navbar should remain clean and compact.

Make it sticky on desktop.

Mobile:

hamburger menu

logo

primary CTA

--------------------------------------------------

2. HERO SECTION

--------------------------------------------------

Create a large property-related background photograph.

Apply strong dark overlay + slight blur so content remains readable.

Large headline:

"Your place in Japan is probably already listed here"

Below it place a large dark search panel.

Search panel tabs:

Buy

Rent

Sold

Akiya Bank

Map

Buy selected by default with blue underline.

Main search bar:

large white input

Placeholder:

Try "land near Hakuba"

Right side:

List dropdown

Search button with search icon

Below input show marketplace statistics such as:

1,536,000+ properties

2,690 sources

Every listing in English

Free to browse

Updated daily

Next row:

"Not sure where to start?"

Buttons:

Use the search wizard

Try the map

Bottom left:

Need help? Consult an expert

Bottom right:

Sign in with Google

Sign in with Apple

These are UI-only buttons.

--------------------------------------------------

3. FRESH THIS WEEK

--------------------------------------------------

Dark section.

Small pill:

NEW THIS WEEK

Heading:

Fresh this week

Supporting text with dynamic-looking number:

11,339 listed in the last seven days.

Right:

Browse the week →

Create horizontal property carousel.

Show approximately 3 cards on desktop.

Each property card contains:

large property image

"Added 2 days ago" badge

image navigation arrows

image pagination dots

price overlay

Example:

USD $15,000

Property location:

Tsu, Mie Prefecture

Tags:

Buy

House

3LDK

Renovation Project

+6

Metadata:

bedrooms

floor area

year built

Nearby amenity:

7-Eleven — 7 min drive

Cards should have rounded corners, dark background and subtle hover elevation.

Carousel arrows must work using frontend state.

--------------------------------------------------

4. MEMBERS-ONLY PROMOTION

--------------------------------------------------

Create a large dark promotional card with thin orange border.

Two-column desktop layout.

LEFT:

Orange pill:

MEMBERS ONLY

Large heading:

Every new listing is members-only

for its first 24 hours

Description explaining early access.

CTA:

Unlock with Free Trial

Small text:

then $5/month · cancel anytime

RIGHT:

Show three locked property preview rows.

Each row:

blurred thumbnail

lock icon

price

location

orange <24h badge

Example:

¥250,000,000

Atami, Shizuoka

¥9,800,000

Atami, Shizuoka

¥4,500,000

Miyawaka, Fukuoka

--------------------------------------------------

5. SIMPLE PRICING

--------------------------------------------------

Alternate dark section.

Centered heading:

Simple pricing

Subtitle:

Browsing stays free forever. Membership is the head start.

No hidden fees. No lock in.

Create one pricing container with two rows.

MONTHLY

badge:

MOST POPULAR

$5.00/month

Free trial · cancel anytime

Buttons:

Start with Card

Start with PayPal

YEARLY

badge:

BEST VALUE

$50.00/year

Save $10 — 2 months free

Buttons:

Start with Card

Start with PayPal

Use blue/green buttons for card and yellow button for PayPal.

Buttons are frontend-only and can open a mock checkout modal.

Below:

Full plan comparison and Premium tier on the pricing page.

--------------------------------------------------

6. PARTNERS

--------------------------------------------------

Section heading:

Our partners

Subtitle:

Our platform is the search engine. Licensed partners handle the purchase.

Create a centered partner card.

Left side:

large bold colored block containing an ORIGINAL fictional partner brand.

Right:

badge:

LICENSED JAPANESE REAL ESTATE BROKERAGE

Partner description.

5-star rating.

Short testimonial.

Carousel pagination dots.

CTA:

Book a consultation →

Use mock partners only.

--------------------------------------------------

7. FREE VS MEMBER COMPARISON

--------------------------------------------------

Alternate dark section.

Heading:

Browse free. Buy smarter as a member.

Description explaining the membership.

Create comparison table.

Columns:

What you get

Free

Member

Rows:

Search, map & original listing links

Property views

See new listings as they land

Email alerts

Full English property write-up & details

Hazard, cost & population data

Comparable sales

Verified land rights & market pace data

Export saved properties to CSV

Use:

green checkmarks

gray X icons

text values such as:

30 free

Unlimited

1 alert

Below table:

Start your 3-day free trial →

Small:

From $5/month · cancel anytime

--------------------------------------------------

8. ARTICLES YOU CAN LISTEN TO

--------------------------------------------------

Return to main dark navy background.

Small pill:

♪ LISTEN

Heading:

Articles You Can Listen To

Use a more editorial serif font for this heading if appropriate.

Subtitle:

Read or listen — every guide has an audio version.

Right:

All articles →

Horizontal article carousel.

Each card:

article image

Audio badge

category

reading time

large article title

short description

play icon

Listen or read →

Use Japanese architecture/property topics.

Example topics:

Shoji screens

Fusuma doors

Machiya homes

Traditional roofs

Renovating old Japanese houses

--------------------------------------------------

9. WHAT IS AN AKIYA?

--------------------------------------------------

Alternate dark section.

Centered heading:

What is an Akiya?

Create a concise explanatory paragraph.

Highlight important text in bold.

Below create three equal cards.

CARD 1:

$0 – $31K

Typical Price Range

CARD 2:

No Restrictions

Foreign Ownership

CARD 3:

2,690+ Sources

Akiya Banks & Agencies

Use blue, green and purple accent text.

Below create a wide HOW IT WORKS container.

Three columns:

1 · Search & discover

Browse listings with map, filters and English descriptions.

2 · Save & get alerts

Save searches and receive alerts.

3 · Connect & purchase

Connect with a licensed partner when ready.

Below create internal navigation links:

Houses for Sale →

Cheap Houses →

Abandoned Houses →

Akiya Bank Listings →

What is an Akiya? →

Compare Japan RE Websites →

--------------------------------------------------

10. FAQ

--------------------------------------------------

Dark navy section.

Centered heading:

Frequently Asked Questions

Create accessible accordion.

Questions:

What is an akiya in Japan?

What is this platform?

Can foreigners buy property in Japan?

Are akiya houses free in Japan?

How much do akiya cost in Japan?

What is an akiya bank?

Is the platform free to use?

First accordion can be open by default.

Accordion should animate smoothly.

Use chevron up/down icons.

--------------------------------------------------

11. PROPERTY TYPES AVAILABLE

--------------------------------------------------

Alternate dark section.

Heading:

Property Types Available

Subtitle:

Live counts, updated as listings land.

3-column grid desktop.

Cards:

House

Houses for sale nationwide

97,981 listings

Apartment

Mansions & apartment units

42,221 listings

Land

Plots, fields & forest

45,419 listings

Akiya Bank

Municipal vacant-house programs

10,980 listings

Traditional House

Kominka & machiya

3,568 listings

Farmhouse

Rural homes with land

1,204 listings

Each card:

title

description

blue listing count

chevron

Hover should slightly brighten card.

Below:

View all property categories →

--------------------------------------------------

12. BROWSE BY REGION

--------------------------------------------------

Dark navy section.

Centered heading:

Browse by Region

Subtitle:

Explore properties across Japan's diverse regions

Create image-card grid.

Regions:

Kanto

78,820 properties

Kyushu

44,848 properties

Kansai

30,028 properties

Hokkaido

22,175 properties

Chubu

21,058 properties

Okinawa

16,128 properties

Tohoku

15,467 properties

Chugoku

11,787 properties

Shikoku

7,956 properties

Hokuriku

1,113 properties

Each card:

regional Japan image

dark bottom gradient

region name

property count

Image should zoom slightly on hover.

Below:

View All Locations →

--------------------------------------------------

13. POPULAR PREFECTURES

--------------------------------------------------

Alternate dark section.

Heading:

Popular Prefectures

Subtitle:

Browse property for sale across Japan's 47 prefectures

Create 6-column desktop grid.

Cards:

Tokyo

28,265 listings

Kanagawa

23,183 listings

Fukuoka

22,860 listings

Hokkaido

22,215 listings

Okinawa

16,147 listings

Osaka

15,871 listings



9,129 listings

Saitama

8,674 listings

Kumamoto

8,029 listings

Miyagi

5,252 listings

Okayama

5,175 listings

Nagasaki

4,757 listings

Inside each card add mini links:

Houses · Apts · Land · Rent

Below:

View All 47 Prefectures →

--------------------------------------------------

14. FOOTER

--------------------------------------------------

Large dark navy footer with border-top.

Use five columns.

COLUMN 1:

Original website brand

Description:

Japan-focused English-language property search platform.

Instagram icon.

COLUMN 2:

PROPERTIES

Buy a House in Japan

Japan House Prices

Cheap Houses

Apartments for Sale

Land for Sale

Akiya Bank Listings

Properties for Rent

Map View

Browse All for Sale

COLUMN 3:

REGIONS

Hokkaido

Tohoku

Kanto

Chubu

Kansai

Chugoku

Shikoku

Kyushu

Okinawa

COLUMN 4:

COMPANY

What is an Akiya?

Getting Started Guide

About Us

Articles

FAQ

Contact

Press & Creators

Consult an Expert

Property Management

COLUMN 5:

ACCOUNT

Sign In

Start Free Trial

POPULAR SEARCHES

Akiya in Tokyo

Akiya in Osaka

Akiya in Hokkaido

Akiya in Kyoto

Akiya in Okinawa

Akiya in Nagano

--------------------------------------------------

15. BACK TO TOP

--------------------------------------------------

Create fixed circular blue button at bottom-right.

Use upward chevron.

Only show after user scrolls down approximately 400px.

Smooth-scroll to top.

--------------------------------------------------

IMAGES

--------------------------------------------------

Use high-quality royalty-free remote placeholder images from sources such as Unsplash for the frontend prototype.

Image themes:

Japanese countryside houses

traditional Japanese homes

machiya

kominka

Tokyo

Mount Fuji

Hokkaido

Okinawa

Kyoto

Japanese mountains

rural Japan

Japanese interiors

Use different images instead of repeating the same image everywhere.

Add object-cover and appropriate lazy loading.

--------------------------------------------------

RESPONSIVE DESIGN

--------------------------------------------------

Desktop:

match the spacious layout of the reference screenshots.

Tablet:

reduce columns appropriately.

Mobile:

- hamburger navbar

- full-width hero

- stacked search controls

- horizontally scrollable property cards

- pricing rows stack

- partner card stacks

- comparison table horizontally scrollable

- property types become 1 column

- regions become 1-2 columns

- prefectures become 2 columns

- footer becomes stacked sections

No horizontal page overflow.

--------------------------------------------------

FRONTEND INTERACTIONS

--------------------------------------------------

Implement frontend-only functionality for:

- navigation

- active tabs

- property carousel

- article carousel

- partner carousel

- search field

- search button

- dropdowns

- FAQ accordion

- pricing modal

- favorite/heart button

- back-to-top button

- responsive mobile navigation

- property card image carousel

- region links

- category links

For Search:

When user enters something and presses Search, navigate to:

/search?q=QUERY

Create a frontend mock search results page.

--------------------------------------------------

PAGES

--------------------------------------------------

Even though the homepage is the main focus, create frontend routes:

/

 /search

 /map

 /articles

 /saved

 /pricing

 /consult

 /login

 /property/:id

 /region/:slug

 /prefecture/:slug

 /category/:slug

These can use mock data.

Do NOT create backend functionality.

--------------------------------------------------

PROJECT STRUCTURE

--------------------------------------------------

Use a clean structure similar to:

src/

  components/

    layout/

      Navbar.tsx

      Footer.tsx

      BackToTop.tsx

    home/

      HeroSearch.tsx

      FreshListings.tsx

      MemberPromo.tsx

      PricingSection.tsx

      PartnersSection.tsx

      MembershipComparison.tsx

      AudioArticles.tsx

      AkiyaInfo.tsx

      FAQSection.tsx

      PropertyTypes.tsx

      RegionGrid.tsx

      PrefectureGrid.tsx

    property/

      PropertyCard.tsx

      PropertyCarousel.tsx

    ui/

      Button.tsx

      Badge.tsx

      Accordion.tsx

      Modal.tsx

  pages/

    Home.tsx

    Search.tsx

    Map.tsx

    Articles.tsx

    Saved.tsx

    Pricing.tsx

    Consult.tsx

    Login.tsx

    PropertyDetails.tsx

    Region.tsx

    Prefecture.tsx

    Category.tsx

  data/

    properties.ts

    regions.ts

    prefectures.ts

    articles.ts

    faq.ts

    partners.ts

  types/

    property.ts

  App.tsx

  main.tsx

--------------------------------------------------

CODE QUALITY

--------------------------------------------------

Do not place the entire website inside App.tsx.

Break every major homepage section into a reusable component.

Create reusable:

Button

Badge

PropertyCard

SectionHeader

Accordion

Carousel controls

Use TypeScript interfaces for all data.

Avoid duplicated JSX.

Keep mock data separate from UI components.

Use semantic HTML:

header

nav

main

section

article

footer

Include appropriate:

aria-label

button labels

alt text

keyboard navigation

--------------------------------------------------

SEO

--------------------------------------------------

Even though this is frontend-only, structure it well for SEO.

Use exactly one H1 on homepage.

Use logical H2/H3 hierarchy.

Use semantic links rather than clickable divs.

Create descriptive page titles.

Add meta descriptions.

Create frontend JSON-LD mock structured data for:

WebSite

Organization

FAQPage

RealEstateListing where appropriate

Do not keyword-stuff.

--------------------------------------------------

IMPORTANT VISUAL REQUIREMENT

--------------------------------------------------

The screenshots I supplied are the PRIMARY visual reference.

Study them carefully.

Reproduce their:

- section order

- proportions

- spacing

- dark navy palette

- card dimensions

- search panel structure

- typography hierarchy

- listing-card density

- pricing layout

- comparison table

- region grid

- prefecture grid

- footer density

The resulting page should feel visually very close to the reference screenshots while remaining an ORIGINAL implementation.

Do NOT copy:

- Akiya Japan logo

- exact brand name

- copyrighted text

- proprietary images

- partner branding

Use an original brand.

Most importantly, do not simplify the page.

I want the FULL LONG HOMEPAGE shown in the reference screenshots, from navbar and hero all the way through the footer.

Generate all necessary frontend files and make sure:

npm install

npm run dev

works without errors

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15d907e2-8d3c-472b-8c97-c52d5045b1cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
