export const validateCreateFurnitureType = async (req, res, next) => {
  try {
    const { name, prefix, openingStock } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters." });
    }

    if (!prefix || prefix.trim().length > 10 || /\s/.test(prefix.trim())) {
      return res.status(400).json({ success: false, message: "Prefix must be up to 10 characters without spaces." });
    }

    if (openingStock !== undefined) {
      if (typeof openingStock !== "number" || openingStock < 0 || openingStock > 10000) {
        return res.status(400).json({ success: false, message: "Opening stock must be between 0 and 10000." });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const validateAdjustAssetCount = async (req, res, next) => {
  try {
    const { typeId } = req.params;
    const { count } = req.body;

    if (!uuidRegex.test(typeId)) {
      return res.status(400).json({ success: false, message: "Invalid Furniture Type ID." });
    }

    if (count === undefined || typeof count !== "number" || count < 0 || !Number.isInteger(count)) {
      return res.status(400).json({ success: false, message: "Count must be a positive integer." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Validation Error", error: error.message });
  }
};
