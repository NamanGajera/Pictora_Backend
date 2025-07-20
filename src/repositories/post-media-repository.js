const { PostMedia } = require("../models");
const CrudRepository = require("./crud-repository");

class PostMediaRepository extends CrudRepository {
  constructor() {
    super(PostMedia);
  }

  async createMultiple(mediaArray, transaction) {
    return this.model.bulkCreate(mediaArray, { transaction });
  }

  async getByPostId(postId) {
    return this.model.findAll({
      where: { postId },
      order: [["createdAt", "ASC"]],
    });
  }
}

module.exports = PostMediaRepository;
