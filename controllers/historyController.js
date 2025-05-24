import History from "../models/History.js";

const HistoryController = {
  getAllHistory: async (req, res) => {
    try {
      const history = await History.getHistory();

      if (!history) {
        return res.json({
          success: true,
          data: {
            id: null,
            text_history: "Sejarah sekolah belum tersedia",
            author: null,
            created_at: null,
          },
        });
      }

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error getting school history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get school history",
        error: error.message,
      });
    }
  },

  updateHistory: async (req, res) => {
    try {
      const { text_sejarah } = req.body;
      const author = req.user.id;
      console.log(req.body);

      // Validasi input
      if (!text_sejarah || text_sejarah.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Text history is required and cannot be empty",
        });
      }

      // Ambil histori yang sudah ada
      const existingHistory = await History.getHistory();
      let updatedHistory;

      if (existingHistory) {
        updatedHistory = await History.updateHistory(existingHistory.id, {
          text_sejarah,
          author,
        });
      } else {
        // Buat baru jika belum ada
        updatedHistory = await History.createHistory({
          text_sejarah,
          author,
        });
      }

      res.json({
        success: true,
        data: updatedHistory,
      });
    } catch (error) {
      console.error("Error updating school history:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update school history",
        error: error.message,
      });
    }
  },
};

export default HistoryController;
