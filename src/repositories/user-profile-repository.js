const { UserProfile } = require("../models");
const CrudRepository = require("./crud-repository");

class UserProfileRepository extends CrudRepository {
  constructor() {
    super(UserProfile);
  }

  async addUserData(data, transaction) {
    const response = await UserProfile.create(data, {
      transaction: transaction,
    });
    return response;
  }
}

module.exports = UserProfileRepository;
