const Merchant = require("../models/MerchantModel")
const Category = require("../models/CategoryModel")



const CreateCategory = async (req, res) => {
    try {
        const id = req.params.merchant_id
        const checkifMerchant = await Merchant.findById(id);
        if (!checkifMerchant) {
            res.json({
                success: false,
                messae: "Merchant deos not exists",
            });
            return
        }
        const iconPath = req.file ? req.file.path : null;
        const New_category = new Category({
            merchant_id: checkifMerchant._id,
            name: req.body.name,
            icon: iconPath,
        });


        const resp = await New_category.save();
        res.json({ success: true, message: "Category Created Successfully", data: resp });

    }catch (err) {
        res.status(err.status || 500).json({
            success: false,
            message: "Failed To Create Category",
            error: err.message || "Internal Server Error",
        });
    
    }
};

const getmerchantcategory = (req, res) => {
    Category.find({}, {})
        .then((resp) => {
            res.json({
                success: true,
                message: "All your Categories",
                data: resp,
            });
        })
        .catch((err) => {
            res.json({
                success: false,
                message: "Failed to Fetch categories",
                error: err.massage,
            });
        });
};

const updateCategory = async (req, res) => {
   
    try {
        const id = req.params.id;
        const iconPath = req.file ? req.file.path : null;

      const resp = await  Category.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                icon: iconPath
            },
            { new: true }
        )

        if (!id) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({
            success: true,
            message: "Category Updated Successfully",
            data: resp,
        });
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to Update Category",
            error: err.massage,
        });
    }



};

const deleteCategory = (req, res) => {
 
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Category ID is required",
        });
    }

    Category.findByIdAndDelete(id)
        .then((deletedCategory) => {
            if (!deletedCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }
            res.status(200).json({
                success: true,
                message: "Category deleted successfully",
            });
        })
        .catch((err) => {
            res.status(500).json({
                success: false,
                message: "Failed to delete category",
                error: err.message, 
            });
        });
};

module.exports = {
    CreateCategory,
    getmerchantcategory,
    updateCategory,
    deleteCategory,
};