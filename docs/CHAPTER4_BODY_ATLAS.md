# Chapter 4: The Human Body | Source-Critical Atlas

## Scope and provenance

This atlas is a searchable reference implementation of **Chapter 4, pages 6–15** of the user's 112-page PDF, *The Book of Knowledge*, credited to Anonymous.

It catalogs the **seven major chakras** (pages 6–9), **Dan Tiens and associated centers** (page 9), **Tan Tien and Haric/Hara descriptions** (pages 11–13), **Cerebellum Chakra** (page 14), and the author's **chakra-light meditation instructions** (pages 14–15). Page 10 contains the book's diagrams, which are not reproduced because the book itself states some pictures may have been taken from other sites without permission. The text summaries are original, not verbatim.

The book describes a 1–50 chakra mapping across dimensions 3–9, but gives **only number ranges** at that point. The atlas preserves the ranges and **does not fabricate 43 additional center descriptions**.

## Catalog structure

The dataset `docs/fb21-body-atlas.js` contains 17 named entries, divided into:

- **7 major:** Root/Base, Sacral, Solar Plexus, Heart, Throat, Third Eye, Crown.
- **6 Dan Tien / related:** God's Head, Soul Star, Thymus/Soul Seat, Core Star, Earth Star, and the brief pineal-spiritual-center note.
- **3 Hara/Tan:** Tan Tien, Haric/Hara Line, ID Point.
- **1 Other Chakra:** Cerebellum Chakra, described on page 14.

The source’s own category labels are used, with “related” and the Hara group as navigation convenience rather than new claims about the tradition.

Each entry explicitly separates:

1. **Location described in the book** (symbolic/esoteric source).
2. **Book’s interpretation** of meaning and purported characteristics.
3. **Health claims: evidence caution**, including clear labeling of unsubstantiated disease associations.
4. **Established anatomical context**, such as the real thymus, coccyx, larynx, cerebellum and pineal gland, without pretending anatomical proximity validates a chakra.

The original text includes particularly serious claims that chakra imbalance causes illnesses, such as cancer, HIV/AIDS, diabetes, addiction, heart disease and schizophrenia. These are **unsupported, potentially harmful medical assertions** and must not be presented as explanations, diagnoses or treatment methods. Mental-health symptoms cannot be assessed using chakra labels.

## The author's page-6 “dimension” mapping

| Dimension label in the book | Chakra numbers |
|---|---|
| Third | 1–7 |
| Fourth | 8–15 |
| Fifth | 16–22 |
| Sixth | 23–29 |
| Seventh | 30–36 |
| Eighth | 37–43 |
| Ninth | 44–50 |

These are the author's framework, **not an empirically established dimensional anatomy**.

## Chapter 4 meditation descriptions (pages 14–15)

After suggesting quieting the mind, the author describes a series of meditations with luminous spheres. A suggested sequence is Crown → Third Eye → Throat → Heart → Solar Plexus → Sacral → Root. The text mentions a proposed one-to-two-week daily practice and treats tingling, pressure or heat as proof of “opening” a chakra. We capture this as *what the book says*, not as measured physiological events or a medically recommended regimen. Its claim that such practice produces out-of-body experiences is not established.

A future optional **original seven-center light visualization** should start with the existing QMM safety foundation. It should **never promise chakra opening, treat a disease or require intense sensations**. The atlas itself is a reference feature, not a meditation, so it does **not** require QMM merely to browse.

## Interface and behavior

- First-class **Human Body Atlas** card on the Quiet Deck home screen.
- Text search across topic name, source location, interpretation, anatomical context, health warnings and page number.
- Accessible category filter buttons and selected-topic details.
- Responsive two-pane layout (stacked on narrow screens), keyboard focus outlines, escaped user query output.
- A separate 1–50 dimension-range section, the book's chapter-four light-meditation sequence, and independent evidence links.
- No accounts, network APIs, health records, diagnostic scores, medical questionnaire or changes to the Signal Ledger.
- Both GitHub Pages entrypoints and the PWA offline cache include the atlas.

## Independent references, distinct from the book

- NIH MedlinePlus anatomy: https://medlineplus.gov/anatomy.html
- Cleveland Clinic thymus anatomy: https://my.clevelandclinic.org/health/body/23016-thymus
- NIH NCCIH on lack of evidence for the energy fields postulated in Reiki: https://www.nccih.nih.gov/health/reiki

These external references **do not endorse the book's chakra claims**. They inform descriptions of biological anatomy and the evidence boundary.

## Design rule

Preserve the author's words and structure as source material, but do not accidentally convert a metaphor, asserted energy field or supposed chakra pathology into medical fact.

**Logic Above Lies. Truth Above Slop.**
