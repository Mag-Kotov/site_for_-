import json
import os
import subprocess
from telegram import Update
from telegram import ReplyKeyboardMarkup

from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters
)

# ------------------- Пути -------------------
REPO_PATH = r"C:\Users\Andrey_Novikov\Desktop\site"
JSON_PATH = os.path.join(REPO_PATH, "data", "product.json")
IMAGES_PATH = os.path.join(REPO_PATH, "data", "images")  # 🆕 Папка для изображений

os.makedirs(IMAGES_PATH, exist_ok=True)  # 🆕 Создаём папку, если её нет

# ------------------- Состояния -------------------
NAME, DESCRIPTION, CATEGORY, PRICE, PHOTO = range(5)  # 🆕 добавлено состояние PHOTO

# ------------------- Работа с JSON -------------------
def load_products():
    if os.path.exists(JSON_PATH) and os.path.getsize(JSON_PATH) > 0:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_products(products):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=4)

def next_id(products):
    if not products:
        return 0
    return max(p['Id'] for p in products) + 1

# ------------------- Git push -------------------
def git_push(commit_message="auto update"):
    try:
        os.chdir(REPO_PATH)
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", commit_message], check=True)
        subprocess.run(["git", "push"], check=True)
        print("✅ Изменения успешно запушены на GitHub.")
    except subprocess.CalledProcessError as e:
        print("⚠️ Ошибка при git push:", e)

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
    await update.message.reply_text("Отправьте фото товара или напишите 'нет', если без фото:")  # 🆕
    return PHOTO  # 🆕

# ------------------- Фото товара -------------------
async def add_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):  # 🆕
    product = context.user_data['product']
    products = load_products()
    product['Id'] = next_id(products)

    if update.message.photo:  # Если пользователь прислал фото
        photo = update.message.photo[-1]
        file = await photo.get_file()
        image_path = os.path.join(IMAGES_PATH, f"{product['Id']}.jpg")
        await file.download_to_drive(image_path)
        product['Image'] = os.path.relpath(image_path, REPO_PATH)
    else:
        product['Image'] = None

    products.append(product)
    save_products(products)
    git_push(f"Добавлен товар: {product['Name']} (ID {product['Id']})")

    await update.message.reply_text(f"✅ Товар '{product['Name']}' добавлен с ID {product['Id']}")
    return ConversationHandler.END

async def skip_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):  # 🆕
    product = context.user_data['product']
    products = load_products()
    product['Id'] = next_id(products)
    product['Image'] = None
    products.append(product)
    save_products(products)
    git_push(f"Добавлен товар: {product['Name']} (ID {product['Id']})")
    await update.message.reply_text(f"✅ Товар '{product['Name']}' добавлен без фото (ID {product['Id']})")
    return ConversationHandler.END

# ------------------- Список -------------------
async def list_products(update: Update, context: ContextTypes.DEFAULT_TYPE):
    products = load_products()
    if not products:
        await update.message.reply_text("Список товаров пуст.")
        return

    for p in products:
        text = (
            f"ID: {p['Id']}\n"
            f"Имя: {p['Name']}\n"
            f"Описание: {p['Description']}\n"
            f"Категория: {p['Category']}\n"
            f"Цена: {p['Price']} Руб\n"
        )
        if p.get('Image'):
            await update.message.reply_photo(photo=open(os.path.join(REPO_PATH, p['Image']), 'rb'), caption=text)
        else:
            await update.message.reply_text(text)

# ------------------- Поиск -------------------
async def find_product(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        id_search = int(context.args[0])
    except (IndexError, ValueError):
        await update.message.reply_text("Использование: /find <id>")
        return

    products = load_products()
    product = next((p for p in products if p['Id'] == id_search), None)
    if not product:
        await update.message.reply_text(f"Товар с ID {id_search} не найден.")
        return

    text = (
        f"ID: {product['Id']}\n"
        f"Имя: {product['Name']}\n"
        f"Описание: {product['Description']}\n"
        f"Категория: {product['Category']}\n"
        f"Цена: {product['Price']} Руб"
    )
    if product.get('Image'):
        await update.message.reply_photo(photo=open(os.path.join(REPO_PATH, product['Image']), 'rb'), caption=text)
    else:
        await update.message.reply_text(text)

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
        if product.get('Image'):
            try:
                os.remove(os.path.join(REPO_PATH, product['Image']))
            except FileNotFoundError:
                pass

        products.remove(product)
        save_products(products)
        git_push(f"Удалён товар ID {id_delete}")
        await update.message.reply_text(f"🗑 Товар ID {id_delete} удалён.")
    else:
        await update.message.reply_text(f"Товар с ID {id_delete} не найден.")
async def test(update:Update, context:ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🗑 Товар ID  удалён.")
    return
    

# Добавляем обработчик после всех других app.add_handler



# ------------------- Запуск -------------------
if __name__ == "__main__":
    TOKEN = "7762237069:AAFw853pE03NFpwMQjOw9VH0DBOqtlYjP8E"  # 🔒 замените на свой
    app = ApplicationBuilder().token(TOKEN).build()

    add_conv = ConversationHandler(
        entry_points=[CommandHandler('add', add_start)],
        states={
            NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_name)],
            DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_description)],
            CATEGORY: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_category)],
            PRICE: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_price)],
            PHOTO: [
                MessageHandler(filters.PHOTO, add_photo),
                MessageHandler(filters.TEXT & filters.Regex("^(нет|Нет|no|No)$"), skip_photo)
            ],
        },
        fallbacks=[]
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(add_conv)
    app.add_handler(CommandHandler("list", list_products))
    app.add_handler(CommandHandler("find", find_product))
    app.add_handler(CommandHandler("delete", delete_product))
    app.add_handler(CommandHandler("test", test))
   
    print("Бот запущен...")
    app.run_polling()
