"""Generate the full custom furniture sprite set.

Run:  python3 gen.py
Output: apps/web/public/assets/custom/*.png

Style rules (match LimeZu + the runtime-drawn map):
- top-down with a visible front face (fake 2.5D)
- light from the top-left: top surfaces lightest, right/bottom faces darkest
- 1px dark outline around every silhouette
- sizes in whole/half tiles (TILE = 32) so collision footprints stay exact
"""
from palette import *
from draw import canvas, rect, hline, vline, dot, outline_shape, save


# ---------------------------------------------------------------- desks / office

def desk_monitor():
    """Private-office desk with a monitor, sat from below (avatar faces up)."""
    img = canvas(64, 52)
    # desk top (pale wood) + front face
    rect(img, 1, 18, 62, 40, WOOD_PALE)
    hline(img, 1, 62, 18, (232, 210, 170))          # top lip catches light
    rect(img, 1, 41, 62, 47, WOOD)                  # front face
    hline(img, 1, 62, 47, WOOD_D)
    # legs
    rect(img, 3, 48, 7, 51, WOOD_D)
    rect(img, 56, 48, 60, 51, WOOD_D)
    # monitor: stand + panel with glowing screen
    rect(img, 28, 14, 35, 17, SLATE_D)              # stand base
    rect(img, 30, 10, 33, 14, SLATE_D)              # stand neck
    rect(img, 18, 0, 45, 12, SLATE)                 # panel
    rect(img, 20, 1, 43, 10, SCREEN)                # screen
    rect(img, 20, 1, 43, 3, (198, 232, 238))        # screen glare
    rect(img, 21, 6, 34, 7, SCREEN_D)               # window on screen
    rect(img, 21, 8, 29, 9, SCREEN_D)
    # keyboard + mouse on the desk
    rect(img, 24, 22, 39, 27, GREY_L)
    rect(img, 25, 23, 38, 26, GREY)
    rect(img, 44, 23, 47, 26, GREY_L)
    # coffee mug
    rect(img, 10, 22, 14, 27, RED)
    rect(img, 11, 23, 13, 24, RED_L)
    outline_shape(img, OUTLINE)
    return img


def _office_chair(main, light, dark):
    """Task chair seen from behind (back toward camera) — for desks faced 'up'."""
    img = canvas(28, 36)
    # headrest
    rect(img, 8, 0, 19, 4, dark)
    # backrest
    rect(img, 4, 5, 23, 22, main)
    rect(img, 5, 6, 22, 8, light)                   # top edge light
    vline(img, 4, 5, 22, light)
    rect(img, 9, 11, 18, 17, dark)                  # lumbar stitch
    # armrests
    rect(img, 0, 12, 3, 21, dark)
    rect(img, 24, 12, 27, 21, dark)
    # seat sliver under the back
    rect(img, 6, 23, 21, 26, dark)
    # gas lift + star base
    rect(img, 12, 27, 15, 30, SLATE_D)
    hline(img, 4, 23, 31, SLATE_D)
    rect(img, 3, 32, 6, 33, SLATE_D)
    rect(img, 12, 32, 15, 33, SLATE_D)
    rect(img, 21, 32, 24, 33, SLATE_D)
    outline_shape(img, OUTLINE)
    return img


def office_chair():
    return _office_chair(SLATE, SLATE_L, SLATE_D)


def office_chair_red():
    return _office_chair(RED, RED_L, RED_D)


def cabinet():
    img = canvas(64, 44)
    rect(img, 1, 8, 62, 12, SLATE_L)                # top
    rect(img, 1, 13, 62, 41, SLATE)                 # body
    for y0 in (15, 28):                             # two drawers
        rect(img, 4, y0, 59, y0 + 10, SLATE_L)
        rect(img, 4, y0 + 8, 59, y0 + 10, SLATE_D)
        rect(img, 26, y0 + 3, 37, y0 + 5, GREY_L)   # handle
    rect(img, 2, 42, 6, 43, SLATE_D)
    rect(img, 57, 42, 61, 43, SLATE_D)
    outline_shape(img, OUTLINE)
    return img


def whiteboard():
    img = canvas(64, 34)
    rect(img, 0, 0, 63, 27, GREY)                   # frame
    rect(img, 2, 2, 61, 25, WHITE)                  # board
    # scribbles
    hline(img, 6, 30, 7, BLUE)
    hline(img, 6, 24, 11, BLUE)
    hline(img, 6, 34, 15, RED_D)
    rect(img, 42, 8, 56, 18, LEAF_D)                # chart box
    hline(img, 44, 54, 13, WHITE)
    rect(img, 4, 28, 59, 30, GREY_D)                # marker tray
    rect(img, 10, 26, 16, 27, RED)                  # marker
    outline_shape(img, OUTLINE)
    return img


def water_cooler():
    img = canvas(20, 38)
    rect(img, 4, 0, 15, 9, SCREEN)                  # bottle
    rect(img, 5, 1, 9, 8, (198, 232, 238))
    rect(img, 2, 10, 17, 32, WHITE)                 # body
    rect(img, 2, 10, 17, 12, GREY_L)
    rect(img, 5, 16, 8, 19, BLUE)                   # taps
    rect(img, 11, 16, 14, 19, RED)
    rect(img, 2, 33, 17, 35, GREY)                  # base
    outline_shape(img, OUTLINE)
    return img


# ---------------------------------------------------------------- meeting room

def conf_table():
    img = canvas(128, 76)
    rect(img, 2, 10, 125, 58, WOOD_PALE)            # top
    hline(img, 2, 125, 10, (232, 210, 170))
    rect(img, 6, 14, 121, 15, (232, 210, 170))      # inner highlight line
    rect(img, 2, 59, 125, 69, WOOD)                 # front face
    hline(img, 2, 125, 69, WOOD_D)
    rect(img, 6, 70, 12, 75, WOOD_D)                # legs
    rect(img, 115, 70, 121, 75, WOOD_D)
    # papers + laptop props on top
    rect(img, 20, 24, 33, 34, WHITE)
    hline(img, 22, 30, 27, GREY)
    hline(img, 22, 31, 30, GREY)
    rect(img, 56, 22, 75, 36, SLATE)                # laptop
    rect(img, 58, 24, 73, 34, SCREEN)
    rect(img, 94, 26, 103, 35, WHITE)
    outline_shape(img, OUTLINE)
    return img


def tv_wall():
    img = canvas(72, 40)
    rect(img, 0, 0, 71, 35, SLATE_D)                # frame
    rect(img, 3, 3, 68, 32, SCREEN)                 # screen
    rect(img, 3, 3, 68, 8, (198, 232, 238))         # glare band
    rect(img, 8, 14, 34, 27, SCREEN_D)              # shared doc
    rect(img, 40, 14, 63, 27, (140, 190, 200))
    rect(img, 30, 36, 41, 39, SLATE_D)              # wall mount
    outline_shape(img, OUTLINE)
    return img


# ---------------------------------------------------------------- lounge

def _sofa(base, light, dark):
    """3-seat wide sofa, front-facing."""
    img = canvas(84, 34)
    rect(img, 2, 0, 81, 8, base)                    # backrest
    rect(img, 2, 0, 81, 2, light)
    rect(img, 0, 2, 7, 29, base)                    # arms
    rect(img, 76, 2, 83, 29, base)
    rect(img, 0, 2, 2, 29, light)
    rect(img, 81, 2, 83, 29, dark)
    rect(img, 8, 9, 75, 27, dark)                   # seat base
    for i, cx in enumerate((8, 31, 54)):            # three cushions
        rect(img, cx + (0 if i == 0 else 1), 10, cx + 21, 25, base)
        rect(img, cx + (0 if i == 0 else 1), 10, cx + 21, 12, light)
    rect(img, 8, 28, 75, 30, dark)                  # front lip
    rect(img, 8, 31, 12, 33, WOOD_D)                # feet
    rect(img, 70, 31, 74, 33, WOOD_D)
    outline_shape(img, OUTLINE)
    return img


def sofa_red():
    return _sofa(RED, RED_L, RED_D)


def sofa_blue():
    return _sofa(BLUE, BLUE_L, BLUE_D)


def coffee_round():
    img = canvas(40, 34)
    # elliptical top
    px_rows = [(12, 27, 4), (8, 31, 5), (5, 34, 6), (3, 36, 7), (2, 37, 8),
               (2, 37, 15), (3, 36, 16), (5, 34, 17), (8, 31, 18), (12, 27, 19)]
    for x0, x1, y in px_rows:
        hline(img, x0, x1, y, WOOD_PALE)
    rect(img, 2, 8, 37, 14, WOOD_PALE)              # fill the middle band
    hline(img, 5, 34, 5, (232, 210, 170))
    rect(img, 2, 20, 37, 21, WOOD)                  # rim front
    rect(img, 17, 22, 22, 29, WOOD)                 # column
    rect(img, 11, 30, 28, 32, WOOD_D)               # foot
    # magazine
    rect(img, 15, 9, 24, 15, RED)
    rect(img, 16, 10, 23, 11, RED_L)
    outline_shape(img, OUTLINE)
    return img


def coffee_rect():
    img = canvas(56, 30)
    rect(img, 1, 4, 54, 19, WOOD_PALE)
    hline(img, 1, 54, 4, (232, 210, 170))
    rect(img, 1, 20, 54, 25, WOOD)
    rect(img, 3, 26, 7, 29, WOOD_D)
    rect(img, 48, 26, 52, 29, WOOD_D)
    rect(img, 12, 8, 22, 15, LEAF)                  # plant prop
    rect(img, 34, 9, 43, 16, WHITE)                 # book
    outline_shape(img, OUTLINE)
    return img


def beanbag():
    img = canvas(28, 24)
    rect(img, 6, 0, 21, 3, BLUE_L)
    rect(img, 3, 4, 24, 9, BLUE)
    rect(img, 1, 10, 26, 18, BLUE)
    rect(img, 3, 19, 24, 21, BLUE_D)
    rect(img, 6, 22, 21, 22, BLUE_D)
    rect(img, 4, 4, 9, 12, BLUE_L)                  # highlight
    rect(img, 8, 8, 19, 14, BLUE_D)                 # seat dip
    outline_shape(img, OUTLINE)
    return img


def bookshelf():
    img = canvas(64, 58)
    rect(img, 0, 0, 63, 53, WOOD)                   # carcass
    rect(img, 0, 0, 63, 3, WOOD_L)                  # top
    book_colors = [RED, BLUE, LEAF, YELLOW, GREY_L, POT]
    for row, y0 in enumerate((6, 22, 38)):
        rect(img, 3, y0, 60, y0 + 12, WOOD_D)       # shelf hole
        x = 5
        i = row
        while x < 56:
            w = 3 + (i % 3)
            c = book_colors[i % len(book_colors)]
            rect(img, x, y0 + 2 + (i % 2), x + w, y0 + 12, c)
            x += w + 2
            i += 1
        hline(img, 3, 60, y0 + 13, WOOD_L)          # shelf board
    rect(img, 1, 54, 5, 57, WOOD_D)
    rect(img, 58, 54, 62, 57, WOOD_D)
    outline_shape(img, OUTLINE)
    return img


def plant_tall():
    img = canvas(26, 44)
    # leaves
    rect(img, 10, 0, 15, 10, LEAF)
    rect(img, 3, 4, 9, 14, LEAF_L)
    rect(img, 16, 3, 22, 13, LEAF_D)
    rect(img, 6, 12, 19, 22, LEAF)
    rect(img, 6, 12, 11, 16, LEAF_L)
    vline(img, 12, 8, 24, LEAF_D)                   # stem shadow
    # pot
    rect(img, 6, 24, 19, 27, POT_L)
    rect(img, 7, 28, 18, 38, POT)
    rect(img, 7, 36, 18, 38, POT_D)
    rect(img, 9, 39, 16, 41, POT_D)
    outline_shape(img, OUTLINE)
    return img


def plant_fern():
    img = canvas(24, 28)
    rect(img, 8, 0, 15, 6, LEAF_L)
    rect(img, 2, 3, 8, 10, LEAF)
    rect(img, 15, 3, 21, 10, LEAF_D)
    rect(img, 5, 8, 18, 13, LEAF)
    rect(img, 7, 14, 16, 16, POT_L)                 # pot rim
    rect(img, 8, 17, 15, 24, POT)
    rect(img, 8, 22, 15, 24, POT_D)
    outline_shape(img, OUTLINE)
    return img


# ---------------------------------------------------------------- game corner

def ping_pong():
    img = canvas(96, 68)
    rect(img, 2, 8, 93, 50, PP_GREEN)               # table top
    hline(img, 2, 93, 8, (128, 192, 142))
    rect(img, 2, 28, 93, 29, WHITE)                 # centre line
    rect(img, 46, 4, 49, 33, WHITE)                 # net (slightly raised)
    rect(img, 46, 4, 49, 5, GREY_L)
    rect(img, 2, 51, 93, 58, PP_GREEN_D)            # front face
    rect(img, 8, 59, 13, 66, SLATE_D)               # legs
    rect(img, 82, 59, 87, 66, SLATE_D)
    # paddles + ball
    rect(img, 16, 16, 23, 22, RED)
    rect(img, 19, 23, 21, 26, WOOD)
    rect(img, 70, 36, 77, 42, SLATE)
    rect(img, 73, 33, 75, 35, WOOD)
    dot(img, 58, 20, WHITE); dot(img, 59, 20, WHITE)
    outline_shape(img, OUTLINE)
    return img


def foosball():
    img = canvas(80, 60)
    rect(img, 2, 6, 77, 42, WOOD)                   # body
    rect(img, 6, 10, 73, 38, PP_GREEN)              # field
    rect(img, 6, 10, 73, 11, (128, 192, 142))
    vline(img, 39, 10, 38, WHITE)                   # halfway line
    # rods with players
    for i, x in enumerate((14, 28, 50, 64)):
        vline(img, x, 4, 44, GREY_L)
        c = RED if i % 2 == 0 else BLUE
        for y in (14, 24, 34):
            rect(img, x - 2, y, x + 2, y + 4, c)
    rect(img, 2, 43, 77, 50, WOOD_D)                # front face
    rect(img, 6, 51, 12, 58, WOOD_D)                # legs
    rect(img, 67, 51, 73, 58, WOOD_D)
    outline_shape(img, OUTLINE)
    return img


def arcade():
    img = canvas(36, 54)
    rect(img, 2, 0, 33, 6, RED_D)                   # marquee
    rect(img, 5, 1, 30, 4, YELLOW)
    rect(img, 2, 7, 33, 30, SLATE)                  # cabinet upper
    rect(img, 5, 9, 30, 24, SCREEN)                 # screen
    rect(img, 8, 12, 13, 15, RED)                   # sprites on screen
    rect(img, 20, 17, 25, 20, YELLOW)
    rect(img, 2, 31, 33, 36, SLATE_L)               # control deck
    dot(img, 10, 33, RED); dot(img, 14, 33, YELLOW); dot(img, 18, 33, BLUE)
    rect(img, 25, 32, 27, 34, GREY_L)               # joystick
    rect(img, 2, 37, 33, 50, SLATE_D)               # base
    rect(img, 4, 51, 31, 53, OUTLINE)
    outline_shape(img, OUTLINE)
    return img


ALL = {
    "desk-monitor": desk_monitor,
    "office-chair": office_chair,
    "office-chair-red": office_chair_red,
    "cabinet": cabinet,
    "whiteboard": whiteboard,
    "water-cooler": water_cooler,
    "conf-table": conf_table,
    "tv-wall": tv_wall,
    "sofa-red-wide": sofa_red,
    "sofa-blue-wide": sofa_blue,
    "coffee-round": coffee_round,
    "coffee-rect": coffee_rect,
    "beanbag": beanbag,
    "bookshelf-big": bookshelf,
    "plant-tall": plant_tall,
    "plant-fern": plant_fern,
    "ping-pong": ping_pong,
    "foosball": foosball,
    "arcade": arcade,
}

if __name__ == "__main__":
    for name, fn in ALL.items():
        save(fn(), name)
