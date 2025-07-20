const { Post } = require("../models");
const CrudRepository = require("./crud-repository");

class PostRepository extends CrudRepository {
  constructor() {
    super(Post);
  }

  async incrementLikeCount(postId, transaction) {
    const post = await this.model.findByPk(postId);
    if (!post) {
      throw new AppError(Messages.DATA_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }
    return post.increment("likeCount", { by: 1, transaction });
  }

  async incrementSaveCount(postId, transaction) {
    const post = await this.model.findByPk(postId);
    if (!post) {
      throw new AppError(Messages.DATA_NOT_FOUND, STATUS_CODE.NOT_FOUND);
    }
    return post.increment("saveCount", { by: 1, transaction });
  }

  async getAllWithUser(filter) {
    return this.model.findAll({
      where: filter,
      include: [
        {
          association: "userData",
          attributes: ["id", "userName", "fullName"],
        },
      ],
    });
  }
}

module.exports = PostRepository;
