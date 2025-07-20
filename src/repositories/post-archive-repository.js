const { PostArchive } = require("../models");
const CrudRepository = require("./crud-repository");

class PostArchiveRepository extends CrudRepository {
  constructor() {
    super(PostArchive);
  }

  async removeArchive(postId, userId, transaction) {
    const response = await this.model.destroy({
      where: {
        postId,
        userId,
      },
      transaction,
    });
    if (!response) {
      throw new AppError(Messages.DATA_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }
    return response;
  }
}

module.exports = PostArchiveRepository;
