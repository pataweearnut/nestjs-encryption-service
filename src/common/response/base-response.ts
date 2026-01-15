export class BaseResponse<T> {
    successful: boolean;
    error_code: string;
    data: T | null;
  
    static success<T>(data: T): BaseResponse<T> {
      return {
        successful: true,
        error_code: '',
        data,
      };
    }
  }
  