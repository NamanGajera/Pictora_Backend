const { PostLike } = require("../models");
const CrudRepository = require("./crud-repository");

class PostLikeRepository extends CrudRepository {
  constructor() {
    super(PostLike);
  }

  async removeLike(postId, userId, transaction) {
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

module.exports = PostLikeRepository;
