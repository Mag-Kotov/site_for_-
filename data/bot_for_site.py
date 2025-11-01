import json
import os
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters
)

# Путь к файлу с товарами
PATH = r"C:\Users\Andrey_Novikov\Desktop\site\data\product.json"

# Состояния для диалога добавления
NAME, DESCRIPTION, CATEGORY, PRICE = range(4)

# ------------------- Работа с JSON -------------------
def load_products():
    if os.path.exists(PATH) and os.path.getsize(PATH) > 0:
        with open(PATH, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_products(products):
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

def next_id(products):
    if not products:
        return 0
    return max(p['Id'] for p in products) + 1

# ------------------- Команды -------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "Привет! Я бот для управления товарами.\n\n"
        "Доступные команды:\n"
        "/add - добавить товар\n"
        "/list - показать все товары\n"
        "/find <id> - найти товар по ID\n"
        "/delete <id> - удалить товар"
    )
    await update.message.reply_text(text)

# ------------------- Добавление товара -------------------
async def add_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Введите название товара:")
    return NAME

async def add_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['product'] = {'Name': update.message.text}
    await update.message.reply_text("Введите описание товара:")
    return DESCRIPTION

async def add_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['product']['Description'] = update.message.text
    await update.message.reply_text("Введите категорию товара:")
    return CATEGORY

async def add_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['product']['Category'] = update.message.text
    await update.message.reply_text("Введите цену товара:")
    return PRICE

async def add_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        price = float(update.message.text.replace(',', '.'))
    except ValueError:
        await update.message.reply_text("Неверный формат цены. Попробуйте снова:")
        return PRICE

    context.user_data['product']['Price'] = price

    products = load_products()
    new_product = context.user_data['product']
    new_product['Id'] = next_id(products)
    products.append(new_product)
    save_products(products)

    await update.message.reply_text(f"Товар '{new_product['Name']}' добавлен с ID {new_product['Id']}")
    return ConversationHandler.END

# ------------------- Просмотр всех товаров -------------------
async def list_products(update: Update, context: ContextTypes.DEFAULT_TYPE):
    products = load_products()
    if not products:
        await update.message.reply_text("Список товаров пуст.")
        return

    text = ""
    for p in products:
        text += (
            f"ID: {p['Id']}\n"
            f"Имя: {p['Name']}\n"
            f"Описание: {p['Description']}\n"
            f"Категория: {p['Category']}\n"
            f"Цена: {p['Price']} Руб\n\n"
        )
    await update.message.reply_text(text)

# ------------------- Поиск по ID -------------------
async def find_product(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        id_search = int(context.args[0])
    except (IndexError, ValueError):
        await update.message.reply_text("Использование: /find <id>")
        return

    products = load_products()
    product = next((p for p in products if p['Id'] == id_search), None)
    if product:
        text = (
            f"ID: {product['Id']}\n"
            f"Имя: {product['Name']}\n"
            f"Описание: {product['Description']}\n"
            f"Категория: {product['Category']}\n"
            f"Цена: {product['Price']} Руб"
        )
        await update.message.reply_text(text)
    else:
        await update.message.reply_text(f"Товар с ID {id_search} не найден.")

# ------------------- Удаление -------------------
async def delete_product(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        id_delete = int(context.args[0])
    except (IndexError, ValueError):
        await update.message.reply_text("Использование: /delete <id>")
        return

    products = load_products()
    product = next((p for p in products if p['Id'] == id_delete), None)
    if product:
        products.remove(product)
        save_products(products)
        await update.message.reply_text(f"Товар ID {id_delete} удалён.")
    else:
        await update.message.reply_text(f"Товар с ID {id_delete} не найден.")

# ------------------- Основной запуск -------------------
if __name__ == "__main__":
    TOKEN = "7762237069:AAFw853pE03NFpwMQjOw9VH0DBOqtlYjP8E"
    app = ApplicationBuilder().token(TOKEN).build()

    add_conv = ConversationHandler(
        entry_points=[CommandHandler('add', add_start)],
        states={
            NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_name)],
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_description)],
            CATEGORY: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_category)],
            PRICE: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_price)]
        },
        fallbacks=[]
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(add_conv)
    app.add_handler(CommandHandler("list", list_products))
    app.add_handler(CommandHandler("find", find_product))
    app.add_handler(CommandHandler("delete", delete_product))

    print("Бот запущен...")
    app.run_polling()
