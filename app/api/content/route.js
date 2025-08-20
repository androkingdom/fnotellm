import { ingestAction } from "@/app/services/ingesion";

export async function POST(req, res) {
  try {
    const data = await req.formData();
    const result = await ingestAction(data);
    return Response.json({
      status: 200,
      message: "Success",
      data: result,
    });
  } catch (error) {
    return Response.json({
      status: 500,
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
}
