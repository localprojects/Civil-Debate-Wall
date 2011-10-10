badwords = 'shit fuck twat cunt blowjob buttplug dildo felching fudgepacker jizz smegma clitoris asshole bullshit bullshitter bullshitters bullshitting chickenshit chickenshits clit cockhead cocksuck cocksucker cocksucking cum cumming cums cunt cuntree cuntry cunts dipshit dipshits dumbfuck dumbfucks dumbshit dumbshits fuck fucka fucke fucked fucken fucker fuckers fuckface fuckhead fuckheads fuckhed fuckin fucking fucks fuckup fuckups kunt kuntree kuntry kunts motherfuck motherfucken motherfucker motherfuckers motherfuckin motherfucking shit shitface shitfaced shithead shitheads shithed shits shitting shitty jerk meanie stupid dumb crap'

def has_bad_words(content):
    word_list = badwords.split(" ")
    for word in word_list:
        if word in content.lower():
            return True
    return False
