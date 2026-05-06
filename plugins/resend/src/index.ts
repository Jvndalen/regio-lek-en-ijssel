import type { PluginDescriptor } from "emdash";

export function resendPlugin(): PluginDescriptor {
	return {
		id: "resend",
		version: "0.1.0",
		format: "standard",
		entrypoint: "@regio-lek-en-ijssel/plugin-resend/sandbox",
		capabilities: ["hooks.email-transport:register", "network:fetch"],
        allowedHosts: ["api.resend.com"],
        adminPages: [{ path: "/settings", label: "Resend", icon: "email" }],
	};
}