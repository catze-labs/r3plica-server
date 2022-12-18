import { HttpException } from "@nestjs/common";

export function makeRandomAlphaNumericString(length: number): string {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function axiosReturnOrThrow(response: any) {
  if (response["status"] === "OK" || response["status"] === "1") {
    return response["data"] || response["result"];
  } else {
    const data = response["data"];
    const statusCode = data["code"];
    const errorObject = {
      message: data["errorMessage"],
      data,
    };

    throw new HttpException(errorObject, statusCode);
  }
}
