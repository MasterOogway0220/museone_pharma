import { auth } from "@/lib/auth";

export type Role = "superadmin" | "owner" | "manager" | "cashier";

export const ROLE_PERMS: Record<Exclude<Role, "superadmin">, Perms> = {
  owner: { permProducts: true, permCategories: true, permTransactions: true, permUsers: true, permSettings: true },
  manager: { permProducts: true, permCategories: true, permTransactions: true, permUsers: false, permSettings: false },
  cashier: { permProducts: false, permCategories: false, permTransactions: false, permUsers: false, permSettings: false },
};

type Perms = {
  permProducts: boolean;
  permCategories: boolean;
  permTransactions: boolean;
  permUsers: boolean;
  permSettings: boolean;
};

// Staff log in with a username that is only unique inside their pharmacy,
// so it is stored as "<slug>.<username>".
export function staffUsername(slug: string, username: string) {
  return `${slug}.${username}`.toLowerCase();
}

// Staff often have no email; Better Auth needs one, so use a reserved .invalid address.
function staffEmail(slug: string, username: string) {
  return `${staffUsername(slug, username)}@staff.museone.invalid`;
}

// Same steps as Better Auth's admin createUser: user row, then a credential account.
async function createUser(data: {
  name: string;
  email: string;
  username?: string;
  password: string;
  tenantId: string | null;
  role: Role;
  perms: Perms;
}) {
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(data.email)) {
    throw new Error("A user with this login already exists.");
  }
  const user = await ctx.internalAdapter.createUser({
    name: data.name,
    email: data.email,
    emailVerified: true,
    username: data.username,
    displayUsername: data.username,
    tenantId: data.tenantId,
    role: data.role,
    ...data.perms,
  }, { method: "admin" });
  await ctx.internalAdapter.linkAccount({
    providerId: "credential",
    accountId: user.id,
    userId: user.id,
    password: await ctx.password.hash(data.password),
  });
  return user;
}

export function createSuperAdmin(email: string, password: string) {
  return createUser({
    name: "Super Admin",
    email: email.toLowerCase(),
    password,
    tenantId: null,
    role: "superadmin",
    perms: ROLE_PERMS.owner,
  });
}

export function createStaffUser(input: {
  tenantId: string;
  slug: string;
  name: string;
  username: string;
  password: string;
  role: Exclude<Role, "superadmin">;
}) {
  return createUser({
    name: input.name,
    email: staffEmail(input.slug, input.username),
    username: staffUsername(input.slug, input.username),
    password: input.password,
    tenantId: input.tenantId,
    role: input.role,
    perms: ROLE_PERMS[input.role],
  });
}
