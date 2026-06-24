const ApiResponse = require('../../src/utils/response');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('ApiResponse', () => {
  it('formats success responses', () => {
    const res = createRes();

    ApiResponse.success(res, { id: 1 }, 'ok');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'ok', data: { id: 1 } });
  });

  it('formats created responses', () => {
    const res = createRes();

    ApiResponse.created(res, { id: 1 }, 'created');

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'created', data: { id: 1 } });
  });

  it('formats validation errors', () => {
    const res = createRes();

    ApiResponse.validationError(res, 'bad', [{ field: 'email' }]);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad', errors: [{ field: 'email' }] });
  });


  it('uses default success and error messages when omitted', () => {
    const successRes = createRes();
    const errorRes = createRes();

    ApiResponse.success(successRes);
    ApiResponse.error(errorRes);

    expect(successRes.status).toHaveBeenCalledWith(200);
    expect(successRes.json).toHaveBeenCalledWith({ success: true, message: 'Success', data: null });
    expect(errorRes.status).toHaveBeenCalledWith(500);
    expect(errorRes.json).toHaveBeenCalledWith({ success: false, message: 'Error' });
  });

  it('formats explicit error details', () => {
    const res = createRes();

    ApiResponse.error(res, 'Nope', 403, [{ code: 'FORBIDDEN' }]);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Nope',
      errors: [{ code: 'FORBIDDEN' }],
    });
  });

  it('formats paginated responses', () => {
    const res = createRes();

    ApiResponse.paginated(res, [1, 2], { page: 2, limit: 2, total: 5 }, 'listed');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'listed',
      data: [1, 2],
      pagination: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
  });

  it('formats no-content responses', () => {
    const res = createRes();

    ApiResponse.noContent(res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
