# Manual Filter Cases

## Case 1: Keyword search
- Type `学術振興会`
- Expect matching results to remain visible

## Case 2: Purpose filter
- Select `研究`
- Expect only `研究` opportunities to remain

## Case 3: No-match state
- Type `not-a-match`
- Expect zero results and an empty-state message

## Case 4: Clear filters
- Apply a keyword and one select filter
- Press `条件をクリア`
- Expect all controls to reset and all data to display
