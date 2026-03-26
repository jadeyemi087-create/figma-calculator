# Figma Calculator (Basic + Scientific)

This project implements the calculator UI from your Figma screen and adds a **Scientific Mode** (sin/cos/tan) with a **Deg/Rad** toggle.

## Prereqs

- Install Node.js (LTS) so you have `node` and `npm` available.

## Run

```bash
npm install
npm run dev
```

## Notes

- **Trig functions** use JavaScript `Math.sin/cos/tan`.
- **Deg/Rad** conversion is handled internally (degrees are converted to radians before calling `Math.*`).

