const pagination = (req, res, next) => {
    let { page, size } = req.req;

    page = page !== undefined ? parseInt(page, 10) : 1;
    size = size !== undefined ? parseInt(size, 10) : 10;

    // Ensure page and size are valid integers
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(size) || size < 1) size = 10;

    // Calculate limit and offset based on page and size
    const limit = size;
    const offset = (page - 1) * size;

    // Store the limit and offset in the request object for use in subsequent middleware
    req.limit = limit;
    req.offset = offset;

    // Proceed to the next middleware
    next();
};

module.exports = pagination
