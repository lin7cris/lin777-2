# Daily Records Design

## Goal

Use one cloud record per user per day as the source of truth for parsed foods and exercises.

## Data Model

The `daily_records` collection uses a deterministic document ID derived from `openid` and `YYYY-MM-DD`. Each document stores `foods`, `exercises`, `totalCaloriesIn`, `totalCaloriesOut`, `netCalories`, nutrition totals, and timestamps. Every food and exercise has a stable item ID so one item can be deleted independently.

## Cloud API

The `dailyRecords` cloud function is the only persistence entry point:

- `save`: merge new foods and exercises into today's document and recalculate totals.
- `get`: return the caller's document for the requested date.
- `delete`: remove one food or exercise by item ID and recalculate totals.

The cloud function always obtains `openid` from `cloud.getWXContext()` and never trusts an identity supplied by the client.

## Client Flow

The confirmation page calls `dailyRecords/save` and navigates home only after cloud persistence succeeds. The home page calls `dailyRecords/get` whenever it is shown, renders individual food and exercise rows, and calls `dailyRecords/delete` after a confirmation modal.

## Error Handling

Cloud failures keep the user on the current page and display a non-destructive toast. Delete cancellation makes no request. Missing daily records return an empty normalized record.

## Testing

Pure record logic tests cover append, totals, stable IDs, and deletion. Handler tests cover openid scoping and all actions. Static client tests verify cloud save/get/delete wiring and confirmation UI behavior.
