let authSchemaReady = false;

export const setAuthSchemaReady = (ready) => {
  authSchemaReady = Boolean(ready);
};

export const isAuthSchemaReady = () => authSchemaReady;