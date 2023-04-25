import { ResponseStatusEnum } from '../constants/responseStatusEnum';

export const createResponseBody = (
  status: ResponseStatusEnum,
  data: { [key: string]: any } | null,
  message: Array<string>
) => {
  return {
    status: status,
    data: data,
    messages: message
  };
};
