import { env } from "process";

export default {
  migrate: {
    url: env("DATABASE_URL") || "",
  },
};
