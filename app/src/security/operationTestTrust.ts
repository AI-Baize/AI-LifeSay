// The dedicated operation-test build replaces this module with one fixed local PUBLIC key.
// Normal/free/release builds retain null and never load imported or fixture trust roots.
export const operationTestEnabled:boolean=false;
export const operationTestTrust:JsonWebKey|null=null;
