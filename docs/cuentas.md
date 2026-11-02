# Pinz Cuentas: bill-splitting spec

Nov 2, 2026 · @YOUTHY

Cuentas already runs on the first version merged on 28/10. This spec fixes what it gets wrong (balances and payment direction) and adds what it lacks (per-person consumption, tips, editing, confirmed payments and simplified balances), in five pull requests on top of the existing code.

## Where it stands (2 November)

Tobias merged a first version of Cuentas on 28/10. Expenses load and save, but balances and payments don't yet work the way the screen expects.

| Area | Built today | This spec |
| --- | --- | --- |
| Login and trips | Cookie session (`requiereSesion`) and trips with members and roles | Uses them as they are |
| Expenses | List and add, stored inside each trip document | Adds who paid, date, shares and tip, plus editing and deleting |
| Equal split | Always among all members | Among the people chosen, everyone by default |
| By consumption | Equal split among the people ticked | Each person's own amount, plus an optional tip |
| Balances | Each member's position with the whole group | How each member stands with you, direct or simplified |
| Payments | Saved as soon as someone registers one | The payer registers it, and it counts once the receiver confirms |
| Simplify | Returns transfers and saves nothing | Saves the setting, and balances come back simplified |
| Currency | Each viewer's own (`Usuario.moneda`) | One currency per trip |
| Finished trips | `estadoCuentas` is always null, and leaving ignores balances | "Todos a mano", and no leaving with money pending |

**Bugs to fix first**

1. **Balances read backwards.** The screen expects how each person stands with you, but the API sends their position with the whole group. Loading the worked example today (without the tip), Nacho's screen says "Fede te tiene que devolver $ 79.167", when it's Nacho who has to put money with Fede.
2. **"Pagar" goes the wrong way.** The button sends the person you have to pay, but the API saves that person as the one who paid you. It either answers `sin-deuda-pendiente` or saves a payment nobody made.
3. **"Simplificar cuentas" changes nothing.** The API returns the transfers, the screen ignores them, and the balances stay the same.

## Scope

Each trip gets real expenses, balances and payments; reading receipts, alias/CBU and multiple currencies wait for later.

**This spec delivers**

- Loading an expense split equally or by consumption, with an optional tip (HU-15).
- Choosing who paid and who shares it. Defaults: you paid, and everyone in the trip shares it.
- Editing and deleting expenses.
- Per-person balances, either direct or simplified (the existing "Simplificar cuentas" button).
- Payments between two people that count only once the person receiving them confirms.
- "Todos a mano" on finished trips, and no leaving a trip while you have money pending.

**Waits for later** (each already has a slot or a note in the frontend)

- Reading a receipt photo (HU-22, `ComprobanteSlot`).
- Paying with alias or CBU (HU-18).
- More than one currency per trip.
- Partial payments.

**Builds on what exists.** Login with a cookie session (`requiereSesion`), trips with their members and roles, expenses and payments stored inside each trip document, `pedir` in `web/src/lib/api.ts`, and the activity feed (`registrarMovimiento`). This spec changes them; it doesn't replace them.

## How it fits together

&#91;embedded content: Cuentas request path · web, api, MongoDB\]

Every request passes the membership checks before a route runs, and the screen only shows saldos the API calculated.

## Data model

Expenses and payments stay where they are today: arrays inside each trip document (`viajes`), not collections of their own. This spec adds fields to them, and **Status** says what already exists.

All money is a whole number in the trip's currency (no cents), from 1 to 100.000.000. Dates (`fecha`) are text `YYYY-MM-DD`, as today. Persona ids are user ids (`usuarioId`).

**`viajes.gastos[]`**

| Field | Status | Rules |
| --- | --- | --- |
| `id` | Exists | UUID string |
| `descripcion` | Exists | 1–160 characters, trimmed |
| `monto` | Exists | Total paid, tip included. Always equals the sum of `partes` |
| `pagoId` | Change | Who paid. Today it's always whoever loads it; now it's chosen in the form, you by default |
| `fecha` | Change | Today it's always the current date; now it's optional in the form, today in Buenos Aires by default |
| `division` | Exists | `iguales` · `consumo` |
| `participantes` | Change | Who shares it, for both kinds. Today only `consumo` uses it |
| `partes` | New | `[{ personaId, monto }]`, one per participant, each ≥ 1. Calculated by the API, never sent by the client |
| `propina` | New | The tip in pesos. 0 unless `division` is `consumo` |
| `creadoPorId` | New | Who loaded it, to check who can edit it |
| `pagosConfirmados` | Remove | Never used. Payments live in `pagos` |

**`viajes.pagos[]`**

| Field | Status | Rules |
| --- | --- | --- |
| `id` | New | UUID string, to confirm or reject it |
| `deudorId` | Exists | Who pays: the person who registers it. Today it's saved the other way round |
| `acreedorId` | Exists | Who receives it |
| `monto` | Exists | Fixed when registered: what the payer had to put with that person at that moment |
| `fecha` | Exists | When it was registered |
| `estado` | New | `pendiente` · `confirmado` · `rechazado`. Only `confirmado` changes balances |
| `resueltoEn` | New | Set on confirm or reject |

**Trip fields** (`viajes`)

| Field | Status | Notes |
| --- | --- | --- |
| `miembros` | Exists | `usuarioId`, `nombre`, `pinz`, `rol` (`organizador` · `miembro` · `lector`) |
| `moneda` | New | The trip's currency, copied from the creator's `Usuario.moneda` when the trip is created. Saldos use it instead of the viewer's |
| `cuentasSimplificadas` | New | Defaults to `false`. Set by "Simplificar cuentas" |
| `estadoCuentas` | Change | Calculated in `viajePublico`: `todos a mano` when every net is 0. Today it's always null |

**Data already saved.** A one-off script fills in what old records lack. Expenses get `partes` with today's rule (equal among all members, or among `participantes` for `consumo`), `propina` 0 and `creadoPorId` = `pagoId`. Payments get an `id` and `estado: confirmado`. Trips get `moneda` from their creator.

Lectores can be part of a split, and they can pay or receive money. They just can't load or change expenses (`puedeEditarViaje`).

## Calculation rules

Today the math lives in `calcularNetos`, inside `api/src/rutas/gastos.ts`. It moves to one file of pure functions, `api/src/cuentas/calculo.ts`, with no database access, so it can be tested on its own. These are the rules it follows.

1. **Equal split (`iguales`).** Each share is `floor(monto / n)`. The leftover pesos (always fewer than n) go one each: first to the payer if they share the expense, then in order of persona id. Example: $ 10.000 among Pedro (who paid), Nacho and Santi is 3.334 / 3.333 / 3.333.
2. **By consumption (`consumo`).** The client sends what each person consumed, and it must add up to the amount typed (the receipt before the tip). Tip = `round(subtotal × percentage / 100)`, split in proportion to consumption. Leftover pesos go to the largest fractions, with ties broken by id. The stored `monto` is subtotal + tip. Example: 8.000 / 12.000 / 5.000 with 10% gives 8.800 / 13.200 / 5.500, a total of 27.500.
3. **Net per person (formula below).** Only confirmed payments count, and the nets of everyone in a trip always add up to 0.
4. **Direct balances** (`cuentasSimplificadas` is false). For each expense, every participant except the payer owes the payer their share. Confirmed payments are subtracted, and the two directions of each pair cancel out.
5. **Simplified balances** (`cuentasSimplificadas` is true). Starting from the nets, the person who has to put the most pays the person owed the most, for the smaller of the two amounts. Repeat until everyone is at 0, breaking ties by id. This gives at most n − 1 transfers.
6. **Saldos for "vos".** For each other member: what they transfer to you minus what you transfer to them. Members with no transfer get 0 ("a mano"). This is the Saldos list the screen already shows: positive means they give back to you, negative means you have to put.

**Net of a person** = what they paid − their shares + payments they sent − payments they received.

**Worked example.** A trip with Nacho (the person using the app), Fede, Santi and Pedro. These numbers were checked by running the rules, and they are the test fixture under Tests.

| Expense | Paid by | Split | Shares |
| --- | --- | --- | --- |
| Seña de la cabaña, $ 120.000 | Fede | Equal, all 4 | 30.000 each |
| Súper, $ 10.000 | Pedro | Equal: Pedro, Nacho, Santi | 3.334 / 3.333 / 3.333 |
| Cena, $ 25.000 + 10% tip = $ 27.500 | Nacho | Consumption: Nacho 8.000, Fede 12.000, Santi 5.000 | 8.800 / 13.200 / 5.500 |

Nets: Fede +76.800, Nacho −14.633, Santi −38.833, Pedro −23.334 (sum 0).

| What Nacho sees with | Direct | Simplified |
| --- | --- | --- |
| Fede | −16.800 | −14.633 |
| Santi | +5.500 | 0 |
| Pedro | −3.333 | 0 |

Direct balances need 6 transfers across the group, and simplified ones need 3: Santi, Pedro and Nacho each pay Fede. Once Fede confirms Nacho's $ 14.633 payment, Nacho is a mano with everyone.

## API

The routes live in `api/src/rutas/gastos.ts`, mounted at `/viajes/:id/gastos` behind `requiereSesion`. The five that exist all change, and five are new.

**Conventions** (as the API already does them)

- **Session.** `requiereSesion` reads the `pinz_sesion` cookie and leaves the user in `res.locals.usuarioId`.
- **Membership.** `viajeDelMiembro` loads the trip only if you belong to it; otherwise 404 `no-existe`. Writes check `puedeEditarViaje` (not lector); otherwise 403 `sin-permiso`.
- **Validation.** zod on every body; otherwise 400 `datos-invalidos`, with `detalle` from `z.flattenError`.
- **Errors.** `{ "error": "<code>" }` in kebab-case. The web reads it from `ErrorApi.cuerpo` and shows a voseo message for each code.
- **Activity feed.** Every write adds a line with `registrarMovimiento`, as adding an expense already does.

**Routes** (under `/viajes/:id/gastos`)

| Method | Route | Status | Who can | What changes |
| --- | --- | --- | --- | --- |
| GET | `/` | Change | Any member | Adds `partes`, `propina` and `creadoPorId`. Newest first |
| POST | `/` | Change | Not lector | Accepts `pagoId`, `fecha`, `participantes` for both kinds, `consumos` and `propina`. Returns the whole `Gasto` |
| PATCH | `/:gastoId` | New | Who loaded it, or the organizador | Takes a whole `NuevoGasto` and recalculates `partes` |
| DELETE | `/:gastoId` | New | Who loaded it, or the organizador | 204 |
| GET | `/saldos` | Fix | Any member | How each member stands with you, simplified when the trip says so, with `pagoEnviado` and the trip's currency |
| POST | `/simplificar` | Change | Not lector | Saves `cuentasSimplificadas: true` and returns `Saldos` |
| GET | `/pagos` | New | Any member | `Pago[]`, newest first |
| POST | `/pagos` | Fix | Any member | You are the payer and `personaId` receives it. Saved as `pendiente` |
| POST | `/pagos/:pagoId/confirmar` | New | Only who receives it | Sets `confirmado` |
| POST | `/pagos/:pagoId/rechazar` | New | Only who receives it | Sets `rechazado` |

**NuevoGasto** (by consumption, with a tip)

```json
{
  "descripcion": "Cena",
  "monto": 25000,
  "division": "consumo",
  "pagoId": "<nacho>",
  "fecha": "2026-10-27",
  "participantes": ["<nacho>", "<fede>", "<santi>"],
  "consumos": [
    { "personaId": "<nacho>", "monto": 8000 },
    { "personaId": "<fede>", "monto": 12000 },
    { "personaId": "<santi>", "monto": 5000 }
  ],
  "propina": 10
}
```

An equal split sends `"division": "iguales"` and leaves out `consumos` and `propina`. `pagoId`, `fecha` and `participantes` are optional: you, today, and everyone in the trip. In the request, `propina` is a percentage (10 means 10%); the saved expense keeps the tip in pesos.

The body fails with 400 `datos-invalidos` when `descripcion` isn't 1–160 characters, `monto` isn't a whole number from 1 to 100.000.000, `participantes` repeats someone, a consumption is below 1, or `propina` isn't a whole number from 0 to 100. Two checks have their own code: `participante-no-es-miembro` (exists today), and `consumos-no-suman` when the consumptions don't add up to `monto`.

**Saldos** keeps today's shape and adds two fields:

```json
{
  "viajeId": "…",
  "moneda": "ARS",
  "simplificadas": true,
  "saldos": [
    {
      "persona": { "id": "…", "nombre": "Fede", "pinz": "brujula" },
      "monto": -14633,
      "pagoEnviado": null
    }
  ]
}
```

`monto` is how that person stands with you: positive means they give back to you, negative means you have to put. `pagoEnviado` is `{ id, monto }` when you already told that person you paid and they haven't confirmed yet.

**Registering a payment.** You are the payer, and the amount is what you have to put with that person right now. It returns 409 `sin-deuda-pendiente` (exists today) when you have nothing to put with them, and 409 `pago-ya-pendiente` when one is already waiting for them to confirm. Confirming or rejecting a payment that isn't yours returns 403 `sin-permiso`.

**Effects on the rest of the app**

- `viajePublico` returns `estadoCuentas: "todos a mano"` when every net is 0, instead of always null.
- Leaving a trip (`DELETE /viajes/:id/miembros/yo`) returns 409 `saldo-pendiente` while your net isn't 0.
- Creating a trip copies the creator's currency into `moneda`.

## Frontend changes

`pedir` and the services already talk to the API. What changes is the contract in `web/src/types`, a message for each error code, and the Cuentas form. Agree the contract changes with ignaciolede, who built the frontend, before merging.

**Contract (zod schemas)**

| File | Change |
| --- | --- |
| `types/gasto.ts` | `NuevoGastoSchema` becomes a union on `division`. Shared: `descripcion`, `monto`, and optional `pagoId`, `fecha` and `participantes`. `consumo` adds `consumos` and `propina`. `GastoSchema` adds `partes`, `propina` and `creadoPorId` |
| `types/saldo.ts` | `SaldosSchema` adds `simplificadas`. `SaldoSchema` adds `pagoEnviado` (`{ id, monto }` or null). The meaning of `monto` doesn't change |
| `types/pago.ts` (new) | `PagoSchema`: `id`, `deudorId`, `acreedorId`, `monto`, `fecha`, `estado` |

**Services and hooks**

- `services/gastos.ts`: `simplificar` now expects `Saldos`. Add `pagos`, `confirmarPago`, `rechazarPago`, `editar` and `borrar`.
- `hooks/gastos.ts`: one hook per new function. Every write invalidates gastos, saldos and pagos.
- A small map from error code to message, such as `sin-deuda-pendiente` → "No tenés nada para poner con esa persona", used by every error on the screen.

**Cuentas screen** (`pages/viaje/Cuentas.tsx`)

- **"¿Quién pagó?"**: a chip per member, with "Vos" selected.
- **"¿Entre quiénes?"**: today's "¿Quiénes consumieron?" checkboxes, shown for both kinds and all ticked by default.
- **Por consumo**: an amount field next to each ticked person, a line saying "Faltan $ X por repartir" until it adds up, and tip chips (0 · 10% · 15%). Show "Total con propina: $ 27.500".
- **Expense list**: "Tu parte: $ 8.800" under each expense. Tapping one opens edit and delete, for whoever loaded it or the organizador.
- **Saldos**: "Pagar" shows for lectores too. When `pagoEnviado` is set, the row says "Esperando que Fede confirme" instead.
- **New card, "Te avisaron que te pagaron"**: shows only when a payment to you is pending, such as "Santi te pasó $ 38.833" with "Confirmar" and "No me llegó".
- **"Simplificar cuentas"**: hidden once `simplificadas` is true, replaced by the text "Cuentas simplificadas".

All copy follows the README: voseo, no "deber", and buttons that say what happens.

## Tests

Tests use Node's own test runner through `tsx`, so nothing new gets installed. Replace the placeholder `test` script in `api/package.json` with `"test": "tsx --test \"src/**/*.test.ts\""` and run `docker compose exec api npm test`.

Route tests need the Express app without starting the server, so split `api/src/index.ts` into `app.ts` (routes) and `index.ts` (connect and listen). Each test then starts `app` on a free port and calls it with `fetch`, against a separate test database such as `pinz_test`.

These must pass before the matching step merges. The worked example is the fixture.

**Calculation** (step 1)

- [ ] $ 120.000 split equally among 4 → 30.000 each.
- [ ] $ 10.000 among Pedro (who paid), Nacho and Santi → 3.334 / 3.333 / 3.333.
- [ ] $ 1.001 among 3 when the payer isn't one of them → 334 / 334 / 333, by id.
- [ ] Consumption 8.000 / 12.000 / 5.000 + 10% → 8.800 / 13.200 / 5.500, total 27.500.
- [ ] Consumption 333 / 333 / 334 + 10% → 366 / 366 / 368 (the leftover peso goes to the largest fraction).
- [ ] Nets of the example: +76.800 / −14.633 / −38.833 / −23.334, adding up to 0.
- [ ] Direct: 6 transfers. Nacho sees Fede −16.800, Santi +5.500, Pedro −3.333.
- [ ] Simplified: 3 transfers. Nacho sees Fede −14.633 and 0 with the rest.
- [ ] Nacho's $ 14.633 payment to Fede, once confirmed → Nacho is a mano with everyone. Pending or rejected → nothing changes.

**Routes** (steps 1 to 5)

- [ ] With the worked example, Nacho's `/saldos` says he has to put money with Fede, never Fede's position with the group.
- [ ] "Pagar" from Nacho to Fede saves Nacho as `deudorId`, Fede as `acreedorId`, and `pendiente`.
- [ ] Only the person receiving a payment can confirm or reject it. Anyone else → 403 `sin-permiso`.
- [ ] A second payment to the same person while one is pending → 409 `pago-ya-pendiente`. A payment when you have nothing to put → 409 `sin-deuda-pendiente`.
- [ ] Payments saved before this change count as confirmed.
- [ ] Consumptions that don't add up to `monto` → 400 `consumos-no-suman`.
- [ ] A lector loading an expense → 403 `sin-permiso`. A non-member or an unknown trip → 404 `no-existe`.
- [ ] Editing or deleting someone else's expense as a miembro → 403. As the organizador → allowed.
- [ ] Deleting an expense updates everyone's saldos.
- [ ] After "Simplificar cuentas", Nacho's saldos are Fede −14.633 and 0 with the rest.
- [ ] When the last balance reaches 0, `estadoCuentas` is `todos a mano`, and leaving the trip works again.

## Build plan

Five pull requests, in order. The first two fix the bugs above, so they go first. Each one leaves `main` working and merges only with its tests passing.

| # | Branch | Builds | Done when |
| --- | --- | --- | --- |
| 1 | `cuentas/calculo` | `api/src/cuentas/calculo.ts` with its tests and the `npm test` script, and `/saldos` answering how each member stands with you | The calculation tests pass, and Nacho's screen says he has to put money with Fede |
| 2 | `cuentas/pagos` | Payment direction, `id` and `estado`, `GET /pagos`, confirm and reject, `pagoEnviado`; on the web, "Esperando que confirme" and the confirm or reject card | Nacho pays Fede, Fede confirms, and both see they're a mano |
| 3 | `cuentas/gastos` | `partes`, `propina` and `creadoPorId`, who paid and the date from the form, participants for both kinds, consumption with a tip, edit and delete, and the script for data already saved; on the web, the new contract and form | The worked example's three expenses load from the screen and give its numbers |
| 4 | `cuentas/simplificar` | Saving `cuentasSimplificadas`, simplified saldos and the trip's `moneda`; on the web, the simplified state | Pressing "Simplificar cuentas" leaves Nacho with a single payment, $ 14.633 to Fede |
| 5 | `cuentas/cierre` | `estadoCuentas`, no leaving with money pending, and activity lines for edits, deletes and payments | The route tests pass |

**Building it with Claude Code.** Export this doc as Markdown, save it in the repo as `docs/cuentas.md` and commit it in step 1. For each step, open Claude Code in the repo and ask:

```text
Read docs/cuentas.md and implement step N on a new branch called <branch>.
Follow the conventions in web/README.md. Run the tests and show me the
result before committing.
```

Review the changes in GitHub Desktop before pushing, then open the pull request.

## Open decisions

The spec picks a default for each of these. If the team disagrees, change it here before step 1.

| Question | Spec's default |
| --- | --- |
| Keep expenses inside the trip document, or give them collections of their own? | Inside the trip, as built. MongoDB's 16 MB limit per document leaves room for thousands of expenses |
| One currency per trip, or each person's own? | One per trip, copied from whoever creates it |
| Are balances simplified by default? Can it be undone? | Off until someone presses "Simplificar cuentas". One-way for now |
| Who can edit or delete an expense? | Whoever loaded it, and the organizador |
| Can lectores register payments? | Yes. They still can't load expenses |
| Where do leftover pesos go when splitting equally? | One each, starting with the payer |
| Is the tip only for "Por consumo"? | Yes |
| Partial payments? | No. "Pagar" covers the whole balance with that person |
