const { User } = require("../models");
const CrudRepository = require("./crud-repository");

class UserRepository extends CrudRepository {
  constructor() {
    super(User);
  }

  async registerUser(data, transaction) {
    const response = await User.create(data, { transaction: transaction });
    return response;
  }
}

module.exports = UserRepository;
