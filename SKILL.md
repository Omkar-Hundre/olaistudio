---

name: premium-web-design-system

description: A generalized premium web design system for building polished SaaS products, startups, enterprise platforms, client websites, portfolios, landing pages, dashboards, and marketing websites. Defines visual hierarchy, typography, color systems, spacing, layout composition, responsive behavior, imagery, components, motion, content quality, accessibility, and anti-patterns. Uses strong design principles with configurable brand tokens rather than client-specific styling.

---

# Premium Web Design System & UI Skill Guide

This skill defines a reusable approach for creating premium, modern, production-quality websites and web applications.

It is intentionally **brand-agnostic**.

The same principles should work for:

* SaaS products
* B2B software
* AI products
* Startups
* Enterprise websites
* Technology companies
* Agencies
* Professional services
* E-commerce
* Portfolios
* Personal brands
* Product launches
* Client websites
* Marketing websites
* Internal tools
* Dashboards
* Developer products

The goal is not to make every website look identical.

The goal is to make every website feel **intentional, coherent, premium, and professionally designed** while adapting the visual language to its brand, audience, and purpose.

---

# 1. Core Design Philosophy

## 1.1 Design with hierarchy, not decoration

Every page should have a clear visual hierarchy.

Users should immediately understand:

1. What this page is about
2. Why it matters
3. What they should look at next
4. What action they can take

Do not add visual elements simply because the page feels empty.

Whitespace is part of the design.

A premium interface should feel deliberately composed rather than densely filled.

---

## 1.2 Establish a visual identity before building components

Before creating UI components, determine:

* Primary brand color
* Secondary/accent color
* Background strategy
* Typography
* Border treatment
* Radius system
* Shadow intensity
* Image style
* Icon style
* Motion style
* Content tone

These decisions should be consistent throughout the application.

Do not independently style every section.

---

## 1.3 Prefer systems over isolated decisions

Use reusable design tokens rather than arbitrary values.

For example:

```text
Primary:      brand color
Accent:       secondary highlight
Background:   page background
Surface:      elevated surface
Text:         primary text
Muted:        secondary text
Border:       structural divider
Success:      positive state
Warning:      caution state
Danger:       destructive state
```

Spacing should follow a predictable scale.

Typography should follow a predictable hierarchy.

Corner radii should follow a predictable system.

Buttons should behave consistently.

Cards should share a visual language.

---

## 1.4 Premium does not mean complicated

Avoid confusing visual sophistication with excessive decoration.

Premium design usually comes from:

* Strong typography
* Excellent spacing
* Consistent alignment
* Good imagery
* Clear hierarchy
* Restrained color usage
* High-quality interaction details
* Strong composition
* Thoughtful responsive behavior

It does not require:

* Excessive gradients
* Huge shadows
* Dozens of floating cards
* Random animations
* Glassmorphism everywhere
* Neon effects
* Decorative blobs
* Excessive rounded containers

---

# 2. Brand Token System

Every project should define a brand token layer.

Use semantic names rather than hard-coding colors throughout components.

Example:

```css
--color-primary
--color-primary-hover
--color-secondary
--color-accent
--color-background
--color-surface
--color-surface-muted
--color-text
--color-text-muted
--color-border
--color-success
--color-warning
--color-danger
```

For Tailwind-based projects, map these tokens into the project's theme configuration whenever practical.

---

## 2.1 Color hierarchy

Use color according to importance.

### Primary

Used for:

* Main CTA
* Important navigation states
* Key brand surfaces
* Important highlights
* Selected states

### Secondary

Used for:

* Supporting actions
* Secondary highlights
* Supporting UI elements

### Accent

Used sparingly for:

* Important numbers
* Product highlights
* Charts
* Visual emphasis
* Interactive states

### Neutral colors

Most of the interface should normally be neutral.

Use:

* White
* Off-white
* Slate
* Gray
* Charcoal
* Near-black

depending on the brand.

A premium interface should not require strong colors everywhere.

---

# 3. Typography System

Typography is one of the strongest determinants of perceived quality.

Choose one primary typeface unless there is a clear reason to use two.

Suitable modern sans-serif options include:

* Manrope
* Inter
* Geist
* Plus Jakarta Sans
* DM Sans
* IBM Plex Sans
* Satoshi
* Space Grotesk
* Instrument Sans

The exact font should depend on the brand.

Do not force the same font onto every project.

---

## 3.1 Typography hierarchy

Use a consistent hierarchy.

### Display

Used for:

* Hero headlines
* Major product statements
* Landing page introductions

Typical range:

```text
text-4xl
text-5xl
text-6xl
text-7xl
```

depending on viewport and composition.

### Section heading

Typical range:

```text
text-2xl
text-3xl
text-4xl
```

### Supporting heading

Typical range:

```text
text-lg
text-xl
text-2xl
```

### Body

Typical range:

```text
text-sm
text-base
text-lg
```

### Metadata

Typical range:

```text
text-xs
text-sm
```

---

## 3.2 Typography rules

Use:

```text
font-medium
font-semibold
font-bold
```

intentionally.

Do not make every heading bold.

Use font weight to create hierarchy.

Avoid excessive italic typography.

Italic text should only be used when it serves a clear editorial or typographic purpose.

Maintain comfortable line height.

Avoid extremely wide paragraphs.

A useful narrative width is approximately:

```text
max-w-xl
max-w-2xl
max-w-3xl
```

depending on the content.

---

# 4. Content & Copy System

Good visual design cannot compensate for weak copy.

Content should be:

* Clear
* Specific
* Human
* Direct
* Useful
* Appropriate to the audience

Avoid generic marketing language.

### Avoid

```text
Revolutionizing the future of innovation.

Unlock unparalleled transformation.

The ultimate next-generation ecosystem.

Architecting the future of enterprise excellence.
```

### Prefer

```text
Manage your projects, customers, and invoices from one place.

Automate repetitive operations without changing how your team works.

See what needs attention before it becomes a problem.
```

The copy should communicate the actual value of the product.

---

## 4.1 Avoid artificial authority

Do not invent:

* Grandiose titles
* Fake statistics
* Unverified claims
* Institutional language
* Exaggerated achievements
* Buzzword-heavy descriptions

If a number, certification, customer, partnership, or achievement is not provided, do not fabricate it.

---

# 5. Layout System

Use full-width sections by default.

A common structure is:

```text
w-full
px-4
sm:px-6
md:px-8
lg:px-12
```

However, the content itself can use an inner readable width.

For example:

```text
Section
 └── Full-width container
      └── Content alignment system
           └── max-width content region
```

This preserves horizontal continuity without allowing text to become excessively wide.

---

## 5.1 Full-width does not mean everything must stretch

Backgrounds, dividers, imagery, and major compositions can span the viewport.

Text and interactive content should usually have a readable maximum width.

Use maximum widths based on content rather than blindly applying the same container width everywhere.

---

# 6. Spacing System

Use a consistent spacing scale.

Common values:

```text
gap-2
gap-3
gap-4
gap-6
gap-8
gap-10
gap-12
gap-16
gap-20
gap-24
```

Do not randomly mix dozens of spacing values.

---

## 6.1 Section spacing

Major sections should generally have generous vertical spacing.

Typical range:

```text
py-16
md:py-20
lg:py-24
xl:py-32
```

The exact spacing depends on the density and purpose of the page.

Dense dashboards need less.

Marketing pages often need more.

---

# 7. Grid & Composition

Do not default to three-column cards for every section.

Instead, select the layout based on the information.

Useful compositions include:

### Split layout

```text
Image | Content
```

### Reversed split

```text
Content | Image
```

### Editorial layout

```text
Large heading
        Supporting content
```

### Stat strip

```text
Metric | Metric | Metric
```

### Feature grid

```text
Large Feature | Small Feature
               Small Feature
```

### Asymmetric layout

```text
Large block | Small block
Large block | Small block
```

### Full-width statement

```text
             Large statement
             Supporting text
```

### Product showcase

```text
Text
      Product screenshot
```

Use composition to create rhythm.

---

# 8. Alternating Section Rhythm

Avoid repeating the same layout for the entire page.

For example:

```text
Hero
↓
Product showcase
↓
Feature section
↓
Stat strip
↓
Feature section reversed
↓
Testimonials
↓
CTA
```

Alternating direction creates natural visual rhythm.

A useful pattern is:

```text
Section A:
Image → Content

Section B:
Stats / architectural divider

Section C:
Content → Image

Section D:
Large product showcase

Section E:
Content → Image
```

Do not alternate mechanically if the content does not support it.

Content hierarchy always takes priority over visual rules.

---

# 9. Image & Media System

Images should feel like part of the composition rather than decorations placed inside cards.

---

## 9.1 Edge-to-edge imagery

For major visual sections:

```text
w-full
h-full
object-cover
object-center
```

Media columns should not receive unnecessary inner padding.

If the surrounding composition has rounded corners, allow the image to follow the same clipping boundary.

---

## 9.2 Image framing

When choosing an image:

* Preserve important faces
* Avoid awkward crops
* Avoid cutting subjects at joints
* Keep the visual focal point visible
* Match the aspect ratio to the composition
* Prefer high-resolution source material
* Use consistent image treatment across the page

Do not force every image into `object-cover`.

Use:

```text
object-contain
```

when the complete object or product needs to remain visible.

---

## 9.3 Product screenshots

Product screenshots should be treated as primary design elements.

Good treatments include:

* Large editorial screenshot
* Browser-frame presentation
* Device mockup
* Split-screen showcase
* Dashboard preview
* Layered product composition

Avoid putting every screenshot inside a generic grey card.

---

# 10. Cards & Surfaces

Cards are useful, but they should not become the default answer to every design problem.

Use cards when they represent a real conceptual boundary.

Good uses:

* Pricing plans
* Individual products
* Testimonials
* Feature modules
* Settings groups
* Dashboard widgets
* Independent pieces of information

Avoid creating cards simply to make empty space feel occupied.

---

## 10.1 Card hierarchy

Use different levels of surfaces:

```text
Page background
    ↓
Surface
    ↓
Elevated surface
    ↓
Interactive surface
```

Do not make every card equally elevated.

---

## 10.2 Borders vs shadows

Prefer subtle borders when structural separation is enough.

Use shadows when elevation is meaningful.

Avoid:

```text
heavy shadow
+
thick border
+
gradient background
+
large radius
```

all on the same component.

That usually creates visual noise.

---

# 11. Border Radius System

Define a small radius scale.

For example:

```text
rounded-md
rounded-lg
rounded-xl
rounded-2xl
rounded-3xl
```

Use the radius based on component importance.

Typical approach:

```text
Inputs/buttons      → rounded-md / rounded-lg
Cards               → rounded-xl / rounded-2xl
Large compositions  → rounded-2xl / rounded-3xl
```

Do not use extreme rounding everywhere.

Avoid turning every component into a pill.

---

# 12. Buttons & CTAs

Buttons should have clear hierarchy.

### Primary CTA

Strongest visual treatment.

### Secondary CTA

Lower visual weight.

### Tertiary action

Text or minimal button.

Example hierarchy:

```text
Primary:   bg-primary text-white
Secondary: border border-border
Tertiary:  text-primary
```

Avoid multiple competing primary buttons in the same visual area.

A hero section should generally have one obvious primary action.

---

# 13. Navigation

Navigation should prioritize clarity.

Desktop navigation can include:

```text
Logo
Primary navigation
Secondary navigation
CTA
```

Do not overcrowd navigation.

Mobile navigation should simplify rather than simply shrink the desktop version.

Important:

* Maintain strong contrast
* Make active states obvious
* Keep clickable areas large enough
* Avoid unnecessary navigation items
* Keep CTA placement consistent

---

# 14. Hero Sections

The hero is the highest-priority composition on a marketing page.

It should answer:

1. What is this?
2. Who is it for?
3. Why should I care?
4. What should I do next?

A strong hero usually contains:

```text
Eyebrow / category
Headline
Supporting explanation
Primary CTA
Optional secondary CTA
Supporting visual
```

Do not overcrowd the hero with:

* Multiple badges
* Excessive statistics
* Four CTAs
* Decorative gradients
* Random floating elements

---

# 15. Statistics & Metrics

Statistics should communicate meaningful information.

Good:

```text
10K+
Active users
```

Better:

```text
10K+
teams using the platform every month
```

Do not invent statistics.

Do not display statistics simply because the design has empty space.

---

## 15.1 Architectural stat strips

When appropriate, use a clean horizontal structure:

```text
Metric | Metric | Metric
```

with:

```text
border-y
```

rather than three isolated cards.

This works especially well for:

* Enterprise websites
* Corporate pages
* SaaS marketing pages
* Company profiles
* Investor-facing pages

---

# 16. Logo & Partner Sections

Partner logos should feel like part of the brand system.

Preferred approaches:

### Static logo row

Useful when there are few partners.

### Moving marquee

Useful for a larger collection.

Use:

```text
overflow-hidden
```

and a smooth continuous track.

Avoid putting every logo inside:

```text
bg-gray-100
border
rounded-xl
```

unless the brand guidelines explicitly require it.

Logos should normally be presented cleanly and independently.

---

## 16.1 Logo sizing

Use consistent visual height rather than forcing identical width.

For example:

```text
h-8
h-10
h-12
h-14
```

depending on the logo set.

Some logos are naturally wider than others.

Do not distort them to make them mathematically identical.

---

# 17. Founder & Leadership Sections

Leadership sections should feel credible rather than promotional.

Useful composition:

```text
Image
+
Name / Role
+
Short biography
+
Leadership statement
+
Relevant metrics
```

A large split layout can work well:

```text
Image | Story
```

For premium presentation, the image can extend edge-to-edge while the content uses internal spacing.

Avoid:

* Excessive titles
* Fake authority
* Decorative badges
* Overwritten biographies
* Generic inspirational quotes

---

# 18. Testimonials

Testimonials should look like real human statements.

Include when available:

```text
Quote
Name
Role
Company
Optional photograph
```

Avoid generic anonymous quotes unless anonymity is intentional.

Do not over-style testimonials.

Simple typography often feels more credible.

---

# 19. Forms

Forms should be visually quiet and easy to understand.

Use:

* Clear labels
* Helpful placeholders
* Strong focus states
* Visible validation
* Appropriate spacing
* Large enough interaction targets

Avoid unnecessary:

* Floating labels
* Decorative backgrounds
* Excessive icons
* Multi-step forms when one step is enough

---

# 20. Dashboards & SaaS Applications

Marketing websites and application interfaces should not use exactly the same visual system.

A SaaS dashboard usually requires:

* Higher information density
* Strong navigation
* Clear hierarchy
* Tables
* Filters
* Search
* Status indicators
* Empty states
* Loading states
* Error states

Marketing pages require more:

* Whitespace
* Editorial composition
* Visual storytelling
* Large typography
* Product imagery

Use the same brand system but different density rules.

---

# 21. Responsive Design

Responsive design is not simply:

```text
desktop → smaller desktop
```

Each layout should be intentionally adapted.

Consider:

* Navigation
* Typography
* Grid columns
* Image cropping
* Section order
* CTA placement
* Spacing
* Table behavior
* Card density

---

## 21.1 Mobile priorities

On mobile:

* Reduce visual competition
* Stack complex layouts
* Preserve important content
* Reduce heading sizes
* Reduce excessive spacing where appropriate
* Make CTAs easy to access
* Prevent horizontal overflow

Do not simply hide important desktop content to make a layout fit.

---

# 22. Motion & Interaction

Motion should communicate state or improve understanding.

Good motion:

* Button hover
* Navigation transitions
* Accordion expansion
* Modal entrance
* Scroll reveal
* Logo marquee
* Progress transitions
* Image transitions

Avoid animation simply because it is possible.

---

## 22.1 Motion principles

Animations should generally be:

* Short
* Smooth
* Predictable
* Purposeful
* Subtle

Avoid:

* Excessive bouncing
* Constant movement
* Large parallax effects
* Distracting background animations
* Multiple competing animations

Respect:

```text
prefers-reduced-motion
```

where appropriate.

---

# 23. Gradients

Gradients are allowed when they support the brand.

Use them intentionally.

Good examples:

```text
subtle hero gradient
brand gradient
image overlay
background transition
```

Avoid:

```text
neon glow
large blurred blobs
random purple/blue gradients
multiple competing gradients
```

A gradient should have a reason to exist.

---

# 24. Icons & Illustrations

Use one consistent icon family.

Do not mix:

```text
Lucide
Font Awesome
Material Icons
random SVG icons
```

without a clear reason.

Icons should support comprehension rather than decorate every paragraph.

Avoid putting an icon next to every piece of text.

---

# 25. Section Dividers

Use structural dividers when they improve hierarchy.

Useful:

```text
border-b
border-y
border-t
```

These are especially effective for:

* Statistics
* Navigation
* Content sections
* Tables
* Pricing
* Enterprise pages

Not every section needs a card background.

Sometimes a simple divider is more premium.

---

# 26. Visual Rhythm

A premium page should have rhythm.

Alternate between:

* Dense and spacious
* Large and small
* Image and text
* Dark and light
* Horizontal and vertical
* Editorial and structured

Example:

```text
Hero              → Large / spacious
Product showcase  → Visual / dense
Features          → Structured
Stats             → Minimal
Story             → Editorial
Testimonials      → Human
CTA               → Strong
```

Avoid making every section visually identical.

---

# 27. Dark Sections

Dark sections can create strong contrast.

Use them for:

* Hero
* Product showcase
* Leadership
* Testimonials
* CTA
* Footer

Do not use dark backgrounds everywhere.

Dark sections should have a clear structural purpose.

Maintain sufficient contrast between:

```text
background
heading
body text
muted text
border
interactive elements
```

---

# 28. Accessibility

Premium design must remain usable.

Ensure:

* Sufficient color contrast
* Visible keyboard focus
* Semantic HTML
* Descriptive button labels
* Alt text for meaningful images
* Correct heading hierarchy
* Accessible form labels
* Keyboard-accessible navigation
* Reduced-motion support

Do not sacrifice usability for visual aesthetics.

---

# 29. Loading, Empty & Error States

Production-quality interfaces must account for states beyond the ideal case.

Design:

```text
Loading
Success
Empty
Error
Disabled
Offline
Partial data
```

An interface that only looks good with perfect data is not production-quality.

Empty states should explain:

1. What happened
2. Why the user is seeing this
3. What they can do next

---

# 30. Data Visualization

Charts should prioritize readability.

Use brand colors sparingly.

Do not make every chart visually dramatic.

Prefer:

* Clear labels
* Strong hierarchy
* Consistent axes
* Useful tooltips
* Meaningful comparisons
* Accessible contrast

The visualization should communicate the data rather than compete with it.

---

# 31. Premium Design Checklist

Before considering a page complete, verify:

### Visual hierarchy

* Is the primary message immediately obvious?
* Is there one dominant focal point?
* Are secondary elements visually subordinate?

### Typography

* Is the font consistent?
* Are heading sizes intentional?
* Are line lengths readable?
* Is font weight being used deliberately?

### Layout

* Are sections aligned?
* Is spacing consistent?
* Does the page have visual rhythm?
* Are layouts varied without becoming chaotic?

### Color

* Is the palette restrained?
* Are primary and secondary actions obvious?
* Is the accent color being overused?

### Components

* Are cards actually necessary?
* Are buttons consistent?
* Are borders and shadows used intentionally?
* Are radii consistent?

### Imagery

* Are images high quality?
* Are subjects framed correctly?
* Are images being unnecessarily cropped?
* Do product screenshots receive enough visual importance?

### Copy

* Is the language human?
* Are claims specific and truthful?
* Is unnecessary marketing fluff removed?
* Does each section communicate something useful?

### Responsive behavior

* Does the layout intentionally adapt to mobile?
* Does typography remain readable?
* Are important actions accessible?
* Is there any horizontal overflow?

### Interaction

* Are hover and focus states present?
* Are animations purposeful?
* Does motion remain subtle?

### Accessibility

* Is contrast sufficient?
* Is the interface keyboard accessible?
* Are semantic elements being used correctly?

---

# 32. Strict Anti-Patterns

Avoid these unless there is a deliberate brand-specific reason.

## Generic SaaS Card Grid

Do not automatically turn every feature into:

```text
[ Icon ]

Feature title

Lorem ipsum style description
```

Especially not six identical cards in a 3×2 grid.

---

## Excessive Glassmorphism

Avoid:

```text
backdrop-blur
+
semi-transparent white
+
glow
+
border
+
shadow
```

on every component.

---

## Artificial Glow

Avoid large decorative:

```text
blur-3xl
blur-[100px]
radial-gradient
```

background effects unless they are genuinely part of the visual identity.

---

## Floating Badge Overload

Do not fill the interface with badges such as:

```text
AI Powered
Enterprise Ready
Next Generation
Trusted Technology
Built for Scale
Industry Leading
```

unless these communicate real information.

---

## Excessive Pills

Do not make every element:

```text
rounded-full
```

Pills should be reserved for:

* Tags
* Status indicators
* Compact filters
* Small metadata
* Certain CTA styles

---

## Generic Grey Boxes

Do not place every piece of content inside:

```text
bg-gray-100
border
rounded-xl
```

Use whitespace and dividers when they communicate structure better.

---

## Excessive Shadows

Avoid stacking:

```text
shadow-lg
+
border
+
gradient
+
rounded-3xl
```

on every element.

---

## Decorative Icon Abuse

Do not add icons merely because a section looks empty.

Every icon should have a purpose.

---

## Fake Complexity

Do not add:

* Unnecessary tabs
* Fake dashboards
* Decorative statistics
* Random timelines
* Complex navigation
* Artificial interaction

just to make the website look more sophisticated.

---

## AI Buzzwords

Avoid language that sounds generated rather than useful.

Do not use phrases such as:

```text
revolutionary ecosystem
next-generation transformation
intelligent paradigm
institutional-grade innovation
architecting the future
unprecedented scale
```

unless the wording is genuinely appropriate and backed by substance.

---

# 33. Brand Adaptation Rule

The design system should adapt to the project.

Do not force:

```text
navy + white
Manrope
rounded-3xl
```

onto every website.

Instead, determine the brand's visual personality first.

Possible directions include:

```text
Corporate
Minimal
Editorial
Luxury
Technical
Playful
Industrial
Financial
Healthcare
Consumer
Developer-focused
Creative
Premium SaaS
Enterprise
```

The underlying principles remain consistent while the visual tokens change.

---

# 34. Recommended Default Design Profile

When no design direction is provided, use this as the default baseline:

### Typography

```text
Modern sans-serif
Medium-weight headings
Comfortable body text
Minimal italic usage
```

### Colors

```text
White / off-white background
Dark neutral text
One strong brand color
One restrained accent
Subtle neutral borders
```

### Layout

```text
Full-width sections
Generous whitespace
Responsive grids
Editorial split layouts
Occasional architectural dividers
```

### Components

```text
Minimal cards
Strong buttons
Subtle borders
Moderate corner radius
Low-intensity shadows
```

### Imagery

```text
High-resolution
Consistent treatment
Intentional cropping
Large visual compositions
```

### Motion

```text
Subtle
Fast
Purposeful
Accessible
```

---

# 35. Final Design Principle

The objective is not to make a website look expensive through decoration.

The objective is to make every design decision feel intentional.

A premium interface should communicate:

```text
Someone thought carefully about this.
```

That comes from:

* Hierarchy
* Consistency
* Restraint
* Typography
* Composition
* Spacing
* Quality imagery
* Useful interaction
* Clear content
* Strong responsive behavior

When there is a choice between adding another visual effect and improving hierarchy, spacing, typography, or content clarity, **improve the hierarchy, spacing, typography, or content first.**

The design system should provide a strong default without becoming a visual prison.

## Every project should inherit the principles, not necessarily the exact colors, fonts, components, or layouts.

### Implementation mindset

When building a new website from this skill:

1. Understand the product and audience.
2. Establish the visual direction.
3. Define brand tokens.
4. Establish typography hierarchy.
5. Build the global layout system.
6. Create reusable components.
7. Compose sections based on content.
8. Introduce visual rhythm.
9. Add imagery and product visuals.
10. Add purposeful interaction.
11. Optimize responsive layouts.
12. Validate accessibility.
13. Remove unnecessary decoration.
14. Review the entire page as one composition.

## **Do not design each section independently. Design the page as a complete visual system.**
