

## Fix: PDF Generation with Corrupted Font Files

### Problem
The files `src/lib/Roboto-Regular.b64.ts` and `src/lib/Roboto-Bold.b64.ts` contain raw HTML from a GitHub page instead of actual base64-encoded TTF font data. When jsPDF tries to register these as fonts, it fails with a Unicode parsing error.

### Solution: html2canvas Approach

Since replacing the font files with valid base64 data would require very large files, and the user specifically requested the **html2canvas + jsPDF image capture** approach, we will:

1. **Install `html2canvas`** npm package
2. **Create a hidden HTML report component** (`PdfReportTemplate.tsx`) that renders the full medical report using standard HTML/CSS with Serbian characters displayed natively by the browser
3. **Rewrite `generateAnamnezaPdf.ts`** to:
   - Dynamically mount the hidden report component into the DOM (off-screen)
   - Use `html2canvas` to capture it as a high-resolution image
   - Insert that image into a jsPDF A4 page (scaling to fit)
   - Open the PDF in a new tab (with download fallback)
   - Remove the hidden DOM element after capture
4. **Remove the Roboto base64 imports** — no longer needed since text is rendered by the browser

### Files Changed
- **`package.json`** — add `html2canvas`
- **`src/components/PdfReportTemplate.tsx`** (new) — React component rendering the report layout matching the reference image (header with logo + institution, patient table, filtered medical sections, footer with signature)
- **`src/lib/generateAnamnezaPdf.ts`** — complete rewrite: mount hidden element → html2canvas → jsPDF image → cleanup
- **`src/components/SmartFormPanel.tsx`** — no changes needed (already calls generateAnamnezaPdf correctly)

### Key Details
- The hidden element uses `position: fixed; left: -9999px` and a fixed width of 794px (A4 at 96dpi) for consistent capture
- `html2canvas` renders at scale 2 for sharp text
- Institution branding (name, address, logo) pulled from the same `institutionInfo` prop
- Empty / "Nije pomenuto" sections still filtered out using the existing `isEmpty()` logic
- After PDF blob is created, the temporary DOM node is removed immediately
- All Serbian characters (č, ć, ž, š, đ, Cyrillic) render perfectly since the browser handles font rendering

