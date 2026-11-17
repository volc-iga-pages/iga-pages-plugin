# Structured Data Storage

Use `@iga-pages/data` for lightweight application data storage, such as
saving tasks or application settings. This SDK is only available in Pages
projects; Agent projects are not supported. Call it only from Pages server code
with Node.js 20 or newer; do not import it into browser code.

## Setup

Install the SDK as a direct project dependency:

```bash
npm install @iga-pages/data
```

For local development, link a Pages project and use `iga pages dev`.
Local calls access the linked project's real data. The platform supplies credentials; application code does not configure
an endpoint or token, and no Supabase integration is required.

## Usage

Inside a server request handler:

```ts
import { create, get, list, update, remove } from "@iga-pages/data";

const options = { abortSignal: request.signal };
const { ID } = await create({ kind: "task", title: "Write PRD" }, options);
const record = await get(ID, options);
const page = await list({
  filter: { kind: "task" },
  pageNumber: 1,
  pageSize: 20,
}, options);
await update(ID, { title: "Review PRD" }, options);
await remove(ID, options);
```

| Method | Result |
| --- | --- |
| `create(data, options?)` | `{ ID: string }` |
| `get(ID, options?)` | A record, or `null` when absent |
| `list(query?, options?)` | `{ Items, PageNumber, PageSize, TotalCount }` |
| `update(ID, patch, options?)` | `void` |
| `remove(ID, options?)` | `void` |

- Send business fields as a flat JSON object. There is no table or collection
  parameter. Inputs must be JSON-serializable; circular references and BigInt
  values are rejected.
- Records have an `ID`; `CreatedAt` and `UpdatedAt` are optional. The backend
  manages these fields; create and update ignore caller-supplied system fields.
- `list` defaults to `pageNumber: 1` and `pageSize: 20`. Supply business filters
  through `filter`; do not invent cursor, ordering, or filter-operator APIs.
- Every operation accepts optional `{ abortSignal }` as its final argument.

## Error Handling

Use `try/catch` to catch `DataError` around SDK calls. It exposes `code`, optional `status`, and
`message`; `toJSON()` returns these fields for server diagnostics. The following example shows how to catch SDK errors, log them, and return a
failure message to the user:

```ts
import { list, DataError } from "@iga-pages/data";

export async function GET(request: Request) {
  try {
    const page = await list(
      { filter: { kind: "task" } },
      { abortSignal: request.signal },
    );
    return Response.json(page);
  } catch (error) {
    if (!(error instanceof DataError)) throw error;

    console.error("Could not load tasks", error.toJSON());
    return Response.json(
      { message: "Could not load tasks. Please try again later." },
      { status: 503 },
    );
  }
}
```

If a create request times out or loses its connection, check whether the write
completed before retrying to avoid duplicate records.

## User Permissions

The SDK isolates data by project. If the application requires login or separate
user data, validate the caller's identity and record ownership in server code
before calling the SDK.
