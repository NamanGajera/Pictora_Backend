const { PostSave } = require("../models");
const CrudRepository = require("./crud-repository");

class PostSaveRepository extends CrudRepository {
  constructor() {
    super(PostSave);
  }

  async removeSave(postId, userId, transaction) {
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

module.exports = PostSaveRepository;
