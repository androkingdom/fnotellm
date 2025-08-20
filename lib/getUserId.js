"use server";

import { cookies } from "next/headers";

export async function getOrCreateUserID() {
  const cookieStore = await cookies();
  let userID = cookieStore.get("userID")?.value;

  if (!userID) {
    userID = crypto.randomUUID(); // ✅ modern way
    cookieStore.set("userID", userID, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return userID;
}
