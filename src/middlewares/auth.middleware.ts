import type { NextFunction } from "grammy";
import type { MyContext } from "../bot-context";
import { FamilyService } from "../services/family.service";

export async function authMiddleware(ctx: MyContext, next: NextFunction): Promise<void> {
  ctx.auth = null;

  if (ctx.from && !ctx.from.is_bot) {
    ctx.auth = await FamilyService.getAuthContext(BigInt(ctx.from.id));
  }

  await next();
}
