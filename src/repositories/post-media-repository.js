const { PostMedia } = require("../models");
const CrudRepository = require("./crud-repository");

class PostMediaRepository extends CrudRepository {
  constructor() {
    super(PostMedia);
  }

  async createPostMedia(data, transaction) {
    const response = await PostMedia.create(data, {
      transaction: transaction,
    });
    return response;
  }
}

module.exports = PostMediaRepository;
