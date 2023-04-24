export const handleError = async (error: Error | any) => {
  if (!error?.isOperational) {
    // Todo: Restart server and log error if functional error.
  }
};
