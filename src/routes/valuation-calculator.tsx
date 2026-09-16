import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/valuation-calculator")({
  beforeLoad: () => {
    throw redirect({
      to: "/what-is-my-business-worth",
      replace: true,
      statusCode: 301,
    });
  },
});
