import { createEvent } from "seyfert";

/**
 * Emitted once after the client has connected to the gateway and is ready
 * to receive events.
 */
export default createEvent({
    data: {
        once: true,
        name: "botReady",
    },
    async run(user, client) {
        client.logger.info("Login as", user.tag, "ready now!");
    },
});
