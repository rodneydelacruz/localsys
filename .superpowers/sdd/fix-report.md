# Fix Report — Group A (Resident Profiles & Household Mapping)

**Status:** DONE

## Commits
- `1ab56ba` — `fix: address review findings — gender/civil_status casing, suffix select, defaults, filters, error handling`

## Build Verification
- `npm run build` — passed (tsc + vite build, 0 errors)

## Summary of Fixes

| # | Issue | File(s) | Change |
|---|-------|---------|--------|
| 1 | Gender values mismatch | `ResidentsPage.tsx:403-404` | Changed `value="Male"/"Female"` → `value="male"/"female"`, labels kept as "Male"/"Female" |
| 2 | Civil status mismatch | `ResidentsPage.tsx:427-432` | Changed values to lowercase (`single`, `married`, `widowed`, `separated`), removed "Divorced" option |
| 3 | Suffix field type | `ResidentsPage.tsx:382-393` | Replaced `<Input>` with `<Select>` using values `["—", "Jr.", "Sr.", "II", "III", "IV"]` |
| 4 | Nationality default | `ResidentsPage.tsx:53` | Changed `nationality: ''` → `nationality: 'Filipino'` |
| 5 | Blood type missing "—" | `ResidentsPage.tsx:456` | Added `<option value="—">—</option>` as first option |
| 6 | Empty state text | `ResidentsPage.tsx:257`, `HouseholdsPage.tsx:205` | "No residents found." → "No residents yet. Add your first resident." / "No households found." → "No households yet." |
| 7 | HouseholdsPage missing purok filter | `HouseholdsPage.tsx:56,186-196` | Added `purokFilter` state + `<Select>` dropdown + filter logic in `filteredHouseholds` |
| 8 | Error handling in data fetch | `ResidentsPage.tsx:79`, `HouseholdsPage.tsx:81` | Changed `.catch(console.error)` → `.catch((err) => setError(...))` |
| 9 | Safe filter query | `src/api/residents.ts:56` | Added `.trim()` guard to `household_id` interpolation |
