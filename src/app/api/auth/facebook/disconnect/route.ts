import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
  });

  if (!workspaceMember) {
    return NextResponse.json(
      { error: "No workspace found" },
      { status: 404 },
    );
  }

  await prisma.platformConnection.deleteMany({
    where: {
      workspaceId: workspaceMember.workspaceId,
      platform: "facebook",
    },
  });

  return NextResponse.json({ success: true });
}
