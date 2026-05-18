function ok(res, data = null, message = 'OK') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = 'ERROR', code = 1, httpStatus = 400) {
  return res.status(httpStatus).json({ code, message, data: null });
}

module.exports = { ok, fail };
