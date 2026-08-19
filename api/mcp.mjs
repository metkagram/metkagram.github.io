import { createRemoteMcpHandler } from "../remote-mcp/core.mjs";

const handle = createRemoteMcpHandler();

export default {
  fetch(request) {
    return handle(request);
  },
};
