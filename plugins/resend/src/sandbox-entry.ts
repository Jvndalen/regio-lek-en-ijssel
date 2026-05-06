import { definePlugin, type PluginContext } from "emdash";
import { Resend } from 'resend';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const EMAIL_RE = /^.+@.+\..+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

function unreachableNever(): never {
  throw new Error("Resend emails require either text or html content.");
}

async function sendViaResend(
  ctx: PluginContext,
  apiKey: string,
  payload: { from: string; to: string | string[]; subject: string; text?: string; html?: string },
) {
  if (!ctx.http) {
    throw new Error("Missing network:fetch capability");
  }

  const resend = new Resend(apiKey);

  if (payload.text === undefined && payload.html === undefined) {
    throw new Error("Resend emails require either text or html content.");
  }

  const { data } =
    payload.text !== undefined
      ? await resend.emails.send({
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          ...(payload.html !== undefined ? { html: payload.html } : {}),
        })
      : payload.html !== undefined
        ? await resend.emails.send({
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
          })
        : unreachableNever();

  console.log({ data });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`Resend API returned ${response.status}: ${errorText}`);
//   }

  return data;
}

async function buildSettingsPage(ctx: PluginContext) {
  const hasKey = !!(await ctx.kv.get<string>("settings:apiKey"));
  const fromAddress = (await ctx.kv.get<string>("settings:fromAddress")) ?? "";
  
  return {
    blocks: [
      {
        type: "section",
        text: "Configure your Resend API credentials to enable outbound emails.",
      },
      {
        type: "form",
        submit: { label: "Save Settings", action_id: "save_settings" },
        fields: [
          {
            type: "secret_input",
            action_id: "apiKey",
            label: "Resend API Key",
            placeholder: "re_...",
            has_value: hasKey,
            required: true,
          },
          {
            type: "text_input",
            action_id: "fromAddress",
            label: "From Address",
            placeholder: "EmDash <hello@yourdomain.com>",
            initial_value: fromAddress,
            required: true,
          },
        ],
      },
      {
        type: "section",
        text: "Send a quick test email directly through the Resend API to verify your credentials.",
      },
      {
        type: "form",
        submit: { label: "Send Test Email", action_id: "test_email" },
        fields: [
          {
            type: "text_input",
            action_id: "testEmailAddress",
            label: "Test Email Recipient",
            placeholder: "you@example.com",
            initial_value: "",
          },
        ],
      },
    ],
  };
}

async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
  try {
    if (typeof values.apiKey === "string" && values.apiKey && values.apiKey !== "********") {
      await ctx.kv.set("settings:apiKey", values.apiKey);
    }
    
    if (typeof values.fromAddress === "string") {
      if (!isValidEmail(values.fromAddress)) {
        return {
          ...(await buildSettingsPage(ctx)),
          toast: { message: "Invalid From Address (must contain @)", type: "error" },
        };
      }
      await ctx.kv.set("settings:fromAddress", values.fromAddress);
    }
    
    return {
      ...(await buildSettingsPage(ctx)),
      toast: { message: "Settings saved successfully", type: "success" },
    };
  } catch (error) {
    ctx.log.error("Failed to save Resend settings", error);
    return {
      ...(await buildSettingsPage(ctx)),
      toast: { message: "Failed to save settings", type: "error" },
    };
  }
}

export default definePlugin({
  hooks: {
    "email:deliver": {
      exclusive: true,
      handler: async (event: { message: EmailMessage; source: string }, ctx: PluginContext) => {
        const apiKey = await ctx.kv.get<string>("settings:apiKey");
        const fromAddress = await ctx.kv.get<string>("settings:fromAddress");

        if (!apiKey || !fromAddress) {
          ctx.log.error("Cannot send email: Resend API key or From Address is missing");
          throw new Error("Resend credentials missing. Configure them in plugin settings.");
        }

        const { message } = event;

        await sendViaResend(ctx, apiKey, {
          from: fromAddress,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });

        ctx.log.info("Email delivered via Resend", { to: message.to });
      },
    },
  },
  
  routes: {
    admin: {
      handler: async (routeCtx: { input: unknown; request: { url: string } }, ctx: PluginContext) => {
        const interaction = routeCtx.input as {
          type: string;
          page?: string;
          action_id?: string;
          values?: Record<string, unknown>;
        };

        if (interaction.type === "page_load" && interaction.page === "/settings") {
          return buildSettingsPage(ctx);
        }
        
        if (interaction.type === "form_submit" && interaction.action_id === "save_settings") {
          return saveSettings(ctx, interaction.values ?? {});
        }

        if (interaction.type === "form_submit" && interaction.action_id === "test_email") {
          try {
            const apiKey = await ctx.kv.get<string>("settings:apiKey");
            const fromAddress = await ctx.kv.get<string>("settings:fromAddress");
            const testEmailAddress = interaction.values?.testEmailAddress as string;

            if (!apiKey || !fromAddress) {
              return {
                ...(await buildSettingsPage(ctx)),
                toast: { message: "Configure API Key and From Address before sending a test", type: "error" },
              };
            }

            if (!testEmailAddress || !isValidEmail(testEmailAddress)) {
              return {
                ...(await buildSettingsPage(ctx)),
                toast: { message: "Enter a valid test email address", type: "error" },
              };
            }

            await sendViaResend(ctx, apiKey, {
              from: fromAddress,
              to: testEmailAddress,
              subject: "Emdash Plugin Test Email",
              text: "Hello from your EmDash Resend plugin! If you see this, your API credentials are correct.",
            });

            return {
              ...(await buildSettingsPage(ctx)),
              toast: { message: "Test email sent successfully!", type: "success" },
            };
          } catch (e: any) {
            return {
              ...(await buildSettingsPage(ctx)),
              toast: { message: `Error: ${e.message}`, type: "error" },
            };
          }
        }
        
        return { blocks: [] };
      },
    },
  },
});