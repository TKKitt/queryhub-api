const httpMocks = require("node-mocks-http");
const { ensureAuthenticated, errorHandler } = require("../config/middleware");

describe("Middleware", () => {
  describe("ensureAuthenticated", () => {
    it("should call next if the user is authenticated", () => {
      const req = httpMocks.createRequest({
        isAuthenticated: () => true,
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      ensureAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if the user is not authenticated", () => {
      const req = httpMocks.createRequest({
        isAuthenticated: () => false,
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      ensureAuthenticated(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({ error: "User not authenticated" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("errorHandler", () => {
    it("should return 500 and the error stack in development", () => {
      process.env.NODE_ENV = "development";
      const err = new Error("Test error");
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toBe(err.stack);
    });

    it("should return 500 and a generic message in production", () => {
      process.env.NODE_ENV = "production";
      const err = new Error("Test error");
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toBe("Something went wrong");
    });
  });
});
