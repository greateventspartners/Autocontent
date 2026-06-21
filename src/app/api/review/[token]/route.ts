import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { getReviewByToken, submitReview } from "@/lib/db/reviews";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const review = await getReviewByToken(token);

    if (!review) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
    }

    if (review.status !== "PENDING") {
      return NextResponse.json({
        review,
        contentItem: (review as any).content_items,
        alreadyResponded: true,
      });
    }

    return NextResponse.json({
      review,
      contentItem: (review as any).content_items,
      alreadyResponded: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await _request.json();

    const status = body.status;
    if (!status || !["APPROVED", "CHANGES_REQUESTED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const existing = await getReviewByToken(token);
    if (!existing) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Déjà répondu" }, { status: 409 });
    }

    const review = await submitReview(token, {
      status,
      comments: body.comments,
    });

    return NextResponse.json({ review });
  } catch (error) {
    return handleApiError(error);
  }
}
