module.exports = {
    getServiceByName: `
      SELECT product_id, name, service_type FROM product WHERE name = ? LIMIT 1
    `,
    getServiceType: `
      SELECT service_type FROM product WHERE product_id = ? LIMIT 1
    `,
};